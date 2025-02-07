import puppeteer, { Browser, BrowserContext, Page, Protocol } from 'puppeteer'
import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import pLimit from 'p-limit'

import { AppDataSource } from '../data-source'
import WebookAccount from '../entity/WebookAccount'
import { Server } from 'socket.io'

// Add the stealth plugin
puppeteerExtra.use(StealthPlugin())

// Define types for Seat and Category
type Seat = {
  status: string
  entrance: boolean
  seatId: string
  accessible: boolean
  restrictedView: boolean
  type: string
  categoryKey: number
}

type Category = {
  label: string
  price: number
  key: number
  // color is included in test.ts logic; add if needed:
  color?: string
}

export class BrowserManager {
  private static instance: BrowserManager
  private browser: Browser
  private concurrencyLimit: number
  private objectStateCache: Seat[] = []
  private categories: Category[] = []
  private socket: Server | null | undefined
  private lastBookedSeatIdx: number | null = null

  private limit: (fn: () => Promise<void>) => Promise<void>

  public constructor(concurrency = 5) {
    this.concurrencyLimit = concurrency
    this.limit = pLimit(this.concurrencyLimit)
  }

  /**
   * Get or create the singleton instance.
   */
  public static async getInstance(
    concurrency = 5,
    socket: Server | null | undefined
  ): Promise<BrowserManager> {
    if (!BrowserManager.instance) {
      const manager = new BrowserManager(concurrency)
      await manager.launchBrowser()
      manager.socket = socket
      BrowserManager.instance = manager
    }
    return BrowserManager.instance
  }

  /**
   * Launch the single Puppeteer browser using puppeteer-extra.
   */
  private async launchBrowser() {
    this.browser = await puppeteerExtra.launch({
      headless: true, // Set to false for UI debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  /**
   * Close the browser if needed.
   */
  public async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  /**
   * Process multiple accounts concurrently.
   */
  public async processAccounts(accounts: WebookAccount[], eventUrl?: string) {
    const tasks = accounts.map((account) => async () => {
      const context = await this.browser.createBrowserContext()
      try {
        const page = await context.newPage()

        // Restore cookies if available
        await this.restoreCookies(account, context)

        // Check login status, login if necessary
        const isLoggedIn = await this.checkLoginStatus(page)
        if (!isLoggedIn) {
          await this.loginAccount(page, account)
          await this.saveCookies(account, context)
        }

        // If an event URL is provided, attempt to hold tickets.
        if (eventUrl) {
          await this.holdTickets(page, eventUrl)
        }
      } catch (err) {
        console.error(`Error processing account ${account.email}:`, err)
      }
      // Optionally close the context after processing
      // await context.close()
    })

    await Promise.all(tasks.map((task) => this.limit(task)))
  }

  /**
   * Restore cookies from the DB into the given incognito context.
   */
  private async restoreCookies(
    account: WebookAccount,
    context: BrowserContext
  ) {
    if (account.cookiesJson) {
      try {
        const cookies: Protocol.Network.CookieParam[] = JSON.parse(
          account.cookiesJson
        )
        if (cookies && cookies.length) {
          for (const cookie of cookies) {
            await context.setCookie({
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
            })
          }
          console.log(`Cookies restored for ${account.email}`)
          this.socket?.emit('log', {
            kind: 'info',
            message: `Cookies restored for ${account.email}`,
          })
        }
      } catch (err) {
        console.error(`Failed to restore cookies for ${account.email}:`, err)
        this.socket?.emit('log', {
          kind: 'error',
          message: `Failed to restore cookies for ${account.email}: ${err.message}`,
        })
      }
    }
  }

  /**
   * Save cookies from the current context back to the DB.
   */
  private async saveCookies(account: WebookAccount, context: BrowserContext) {
    const cookies = await context.cookies()
    account.cookiesJson = JSON.stringify(cookies)
    await AppDataSource.getRepository(WebookAccount).save(account)
    console.log(`Cookies saved for ${account.email}`)
    this.socket?.emit('log', {
      kind: 'info',
      message: `Cookies saved for ${account.email}`,
    })
  }

  /**
   * Check if the user is logged in.
   */
  private async checkLoginStatus(page: Page): Promise<boolean> {
    await page.goto('https://webook.com/en', {
      waitUntil: 'networkidle0',
      timeout: 80000,
    })
    // If a login button exists, assume the user is not logged in.
    const loginLink = await page.$('a[data-testid="header_nav_login_button"]')
    return !loginLink
  }

  /**
   * Log in the user by filling in the login form.
   */
  private async loginAccount(page: Page, account: WebookAccount) {
    console.log(`Logging in ${account.email}...`)
    await page.goto('https://webook.com/en/login/', {
      waitUntil: 'networkidle0',
    })

    // Optional: click the "Accept all" button if it appears.
    await page.evaluate(() => {
      const xpath = "//button[.//p[contains(text(), 'Accept all')]]"
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      const acceptButton = result.singleNodeValue as HTMLElement | null
      if (acceptButton) {
        acceptButton.click()
      }
    })

    await page.type('input[name="email"]', account.email)
    await page.type('input[name="password"]', account.password)
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    console.log(`Logged in as ${account.email}`)
  }

  /**
   * Hold tickets by navigating through the event booking pages,
   * selecting seats via the seating chart iframe, and proceeding to summary.
   */
  private async holdTickets(page: Page, eventUrl: string) {
    // Go to the event page
    await page.goto(eventUrl, { waitUntil: 'networkidle0' })

    // Wait for the "Book" button and navigate to the booking section
    await page.waitForSelector('a[data-testid="book-button"]', {
      timeout: 5000,
    })
    await page.goto(`${eventUrl}/book`, { waitUntil: 'networkidle0' })

    // Handle a possible multi-day event
    const dayButtonSelector = 'button[name="day"]:not([disabled])'
    try {
      await page.waitForSelector(dayButtonSelector, { timeout: 1000 })
      await page.click(dayButtonSelector)
      this.socket?.emit('log', {
        kind: 'warning',
        message:
          'Current Event has multiple dates, selecting the most recent one.',
      })
    } catch (err) {
      console.log('Current Event has only one date')
      this.socket?.emit('log', {
        kind: 'info',
        message: 'Current Event has only one date',
      })

      // If categories and seats have not been extracted yet, do so.
      if (this.categories.length === 0) {
        await this.extractCategories(page)
      }
      if (this.objectStateCache.length === 0) {
        await this.extractSeats(page)
        // Filter for free seats of type "seat"
        this.objectStateCache = this.objectStateCache.filter(
          (seat) => seat.status === 'free' && seat.type === 'seat'
        )
      }

      // Select up to 5 seats per account.
      let seatIdx =
        this.lastBookedSeatIdx !== null ? this.lastBookedSeatIdx + 1 : 0
      let selectedSeats: string[] = []
      for (let i = seatIdx; i < seatIdx + 5; i++) {
        if (i >= this.objectStateCache.length) break
        selectedSeats.push(this.objectStateCache[i].seatId)
      }
      this.lastBookedSeatIdx = seatIdx + 4

      const formattedSeatsArraySerialized = JSON.stringify(selectedSeats)
      console.log(
        `seatsio.charts[0].trySelectObjects(${formattedSeatsArraySerialized})`
      )
      // Execute the seat selection using the seating chart API.
      await page.evaluate((seats) => {
        // @ts-ignore: assuming seatsio is available globally in the page context
        seatsio.charts[0].trySelectObjects(seats)
      }, selectedSeats)
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
    await this.acceptTerms(page)
  }

  /**
   * Accept the ticketing terms and proceed to payment.
   */
  private async acceptTerms(page: Page) {
    const goToSummaryButtonSelector =
      'button[data-testid="ticketing_tickets_go_to_summary_button"]'
    await page.click(goToSummaryButtonSelector)

    await page.waitForSelector(
      'input[data-testid="ticketing_summary_terms_checkbox"]',
      { timeout: 6000 }
    )
    // Click on all checkboxes (i.e. accept terms)
    await page.evaluate(() => {
      document
        .querySelectorAll('input[type="checkbox"]')
        .forEach((el: HTMLInputElement) => el.click())
    })

    await new Promise((resolve) => setTimeout(resolve, 60))

    const proceedToPaymentButtonSelector =
      '[data-testid="ticketing_summary_proceed_to_payment"]'
    await page.click(proceedToPaymentButtonSelector)

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    this.socket?.emit('log', {
      kind: 'info',
      message: 'Proceeded to payment: ' + page.url(),
    })

    await page.browserContext().close()
  }

  /**
   * Extract seating categories from the seating chart iframe.
   */
  private async extractCategories(page: Page) {
    try {
      // Wait for the iframe with the seating chart to load.
      await page.waitForSelector('[title="seating chart"]', { timeout: 60000 })
      const iframeElement = await page.$('iframe[title="seating chart"]')
      if (!iframeElement) {
        throw new Error('Seating chart iframe not found')
      }
      const frame = await iframeElement.contentFrame()

      // Wait for an element inside the iframe (e.g., the chart container)
      await frame.waitForSelector('#chartContainer', { timeout: 60000 })
      await new Promise((resolve) => setTimeout(resolve, 3000))
      let categories = await frame.evaluate(() => {
        let objects: Category[] = []
        // @ts-ignore: assuming 'chart' is defined in the iframe context
        chart.categories.categories.forEach((category: any) => {
          if (category.categoryPricing.categoryPricing) {
            objects.push({
              label: category.label,
              color: category.color,
              key: category.key,
              price: category.categoryPricing.categoryPricing.price,
            })
          }
        })
        return objects
      })
      this.categories = categories
    } catch (err) {
      console.error('Error extracting categories:', err)
      this.socket?.emit('log', { kind: 'error', message: err.message })
    }
  }

  /**
   * Extract seat availability data from the seating chart iframe.
   */
  private async extractSeats(page: Page) {
    try {
      await page.waitForSelector('[title="seating chart"]', { timeout: 60000 })
      const iframeElement = await page.$('iframe[title="seating chart"]')
      if (!iframeElement) {
        throw new Error('Seating chart iframe not found')
      }
      const frame = await iframeElement.contentFrame()
      await frame.waitForSelector('#chartContainer', { timeout: 60000 })
      await new Promise((resolve) => setTimeout(resolve, 3000))
      let objectStateCache = await frame.evaluate(() => {
        let objects: Seat[] = []
        // @ts-ignore: assuming 'chart' is defined in the iframe context
        for (let [key, value] of chart.objectStateCache.entries()) {
          objects.push({
            status: value.isSelectable.value ? 'free' : 'reserved',
            entrance: key.entrance,
            seatId: key.seatId,
            accessible: key.accessible,
            restrictedView: key.restrictedView,
            type: key.type,
            categoryKey: key.category.key,
          })
        }
        return objects
      })
      this.objectStateCache = objectStateCache
    } catch (err) {
      console.error('Error extracting seats:', err)
      this.socket?.emit('log', { kind: 'error', message: err.message })
    }
  }
}
