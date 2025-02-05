import puppeteer, { Browser, BrowserContext, Page, Protocol } from 'puppeteer'
import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import pLimit from 'p-limit'

import { AppDataSource } from '../data-source'
import WebookAccount from '../entity/WebookAccount'
import { Server } from 'socket.io'

// Add stealth plugin
puppeteerExtra.use(StealthPlugin())

type Seat = {
  status: string
  entrance: boolean
  seatId: string
  accessible: boolean
  restrictedView: boolean
  type: string
}

type Category = {
  label: string
  price: number
  key: number
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
   * Get or create a singleton instance of the BrowserManager.
   * You only want 1 Browser in memory for efficiency.
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
   * Launch the single Puppeteer browser.
   */
  private async launchBrowser() {
    this.browser = await puppeteerExtra.launch({
      headless: false,
      // If you want to see the browser UI, set headless: false
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
   * Main function to process N accounts: ensure each is logged in, then do something (like hold tickets).
   */
  public async processAccounts(accounts: WebookAccount[], eventUrl?: string) {
    const tasks = accounts.map((account) => async () => {
      const context = await this.browser.createBrowserContext()
      try {
        const page = await context.newPage()

        // Restore cookies if present
        await this.restoreCookies(account, context)

        // Check if we are logged in, otherwise login
        const isLoggedIn = await this.checkLoginStatus(page)
        if (!isLoggedIn) {
          await this.loginAccount(page, account)
          // Save cookies for next time
          await this.saveCookies(account, context)
        }

        // Example: hold tickets if eventUrl is specified
        if (eventUrl) {
          await this.holdTickets(page, eventUrl)
        }
      } catch (err) {
        console.error(`Error processing account ${account.email}:`, err)
      }
      // finally {
      //   await context.close()
      // }
    })

    // Run tasks with concurrency limit
    await Promise.all(tasks.map((task) => this.limit(task)))
  }

  /**
   * Restore cookies from the DB into this incognito context.
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
          cookies.forEach((cookie) =>
            context.setCookie({
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
            })
          )
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
   * Save cookies from this context back to the DB for future reuse.
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
   * Check if the user is already logged in.
   * This is site-specific. We'll do a simple check: if there's a "Login" link, maybe not logged in.
   */
  private async checkLoginStatus(page: Page): Promise<boolean> {
    // Example: go to homepage
    await page.goto('https://webook.com/en', {
      waitUntil: 'networkidle0',
      timeout: 80000,
    })

    // If there's a login link or button, assume not logged in
    const loginLink = await page.$('a[data-testid="header_nav_login_button"]')
    return !loginLink
  }

  /**
   * Log in the user by filling the form.
   */
  private async loginAccount(page: Page, account: WebookAccount) {
    console.log(`Logging in ${account.email}...`)
    await page.goto('https://webook.com/en/login/', {
      waitUntil: 'networkidle0',
    })

    // fill the form
    await page.type('input[name="email"]', account.email)
    await page.type('input[name="password"]', account.password)
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    console.log(`Logged in as ${account.email}`)
  }

  /**
   * Sample "holdTickets" method.
   * Adjust the selectors/timeouts to match your target site.
   */
  private async holdTickets(page: Page, eventUrl: string) {
    // Go to the event
    await page.goto(eventUrl, { waitUntil: 'networkidle0' })

    // Example: wait for a "Book" button, then navigate or click
    await page.waitForSelector('a[data-testid="book-button"]', {
      timeout: 5000,
    })
    await page.goto(`${eventUrl}/book`, { waitUntil: 'networkidle0' })

    // pick first available day
    const dayButtonSelector = 'button[name="day"]:not([disabled])'
    try {
      await page.waitForSelector(dayButtonSelector, { timeout: 1000 })
      await page.click(dayButtonSelector)
      // TODO: prompt the user to select a date
      this.socket?.emit('log', {
        kind: 'warning',
        message:
          'Current Event has multiple dates, going with the most recent one.',
      })
    } catch (err) {
      console.log('Current Event has only one date')
      this.socket?.emit('log', {
        kind: 'info',
        message: 'Current Event has only one date',
      })

      // just one date, proceed with tickets selection and get the payment link
      if (this.categories.length === 0) {
        await this.extractCategories(page)
      }

      if (this.objectStateCache.length === 0) {
        await this.extractSeats(page)
        // filter seats that have a free status
        this.objectStateCache = this.objectStateCache.filter(
          (seat) => seat.status === 'free' && seat.type === 'seat'
        )
      }

      // select the first available seat
      // each account can book 5 tickets at a time
      // since eats are sorted, we can get the index of the last booked seat
      // and start from there

      let seatIdx = 0
      if (this.lastBookedSeatIdx) {
        seatIdx = this.lastBookedSeatIdx + 1
      }

      let selectedSeats = []
      for (let i = seatIdx; i < seatIdx + 5; i++) {
        if (i >= this.objectStateCache.length) {
          break
        }

        selectedSeats.push(this.objectStateCache[i].seatId)
      }
      // update the last booked seat index
      this.lastBookedSeatIdx = seatIdx + 4

      // select the seats
      // "['id1', 'id2']"

      const formattedSeatsArraySerialized = JSON.stringify(selectedSeats)
      console.log(
        `seatsio.charts[0].trySelectObjects(${formattedSeatsArraySerialized})`
      )
      await page.evaluate(
        `seatsio.charts[0].trySelectObjects(${formattedSeatsArraySerialized})`
      )
    }

    await new Promise((resolve) => setTimeout(resolve, 100))

    // accept terms
    await this.acceptTerms(page)

    // data-testid="ticketing_summary_terms_checkbox"
    // data-testid="ticketing_summary_resell_terms_checkbox"

    // proceed next
    // const nextButtonSelector =
    //   '[data-testid="ticketing_calendar_to_tickets_button"]'
    // await new Promise((resolve) => setTimeout(resolve, 1000))
    // await page.click(nextButtonSelector)

    // console.log(`Held tickets for event: ${eventUrl}`)
    // this.socket?.emit('log', {
    //   kind: 'info',
    //   message: `Held tickets for event: ${eventUrl}`,
    // })
  }

  private async acceptTerms(page: Page) {
    // data-testid="ticketing_tickets_go_to_summary_button"

    // click on the "Go to Summary" button
    const goToSummaryButtonSelector =
      'button[data-testid="ticketing_tickets_go_to_summary_button"]'
    await page.click(goToSummaryButtonSelector)

    await page.waitForSelector(
      'input[data-testid="ticketing_summary_terms_checkbox"]',
      { timeout: 6000 }
    )

    // accept terms
    await page.evaluate(
      'document.querySelectorAll(\'input[type="checkbox"]\').forEach(el => el.click())'
    )

    await new Promise((resolve) => setTimeout(resolve, 60))

    // data-testid="ticketing_summary_proceed_to_payment"
    // click on the "Proceed to Payment" button
    const proceedToPaymentButtonSelector =
      '[data-testid="ticketing_summary_proceed_to_payment"]'

    await page.click(proceedToPaymentButtonSelector)

    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    this.socket.emit('log', {
      kind: 'info',
      message: 'Proceeded to payment: ' + page.url(),
    })

    await page.browserContext().close()
  }

  private async extractCategories(page: Page) {
    try {
      await page.waitForSelector('[title="seating chart"]', { timeout: 6000 })

      const iframe = await page.$('iframe[title="seating chart"]')
      const frame = await iframe.contentFrame()

      await new Promise((resolve) => setTimeout(resolve, 3000))
      let categories = await frame.evaluate(() => {
        let objects = []
        chart.categories.categories.forEach((category) => {
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
      this.socket.emit('log', {
        kind: 'error',
        message: err.message,
      })
    }
  }

  private async extractSeats(page: Page) {
    try {
      await page.waitForSelector('[title="seating chart"]', { timeout: 6000 })

      const iframe = await page.$('iframe[title="seating chart"]')
      const frame = await iframe.contentFrame()

      await new Promise((resolve) => setTimeout(resolve, 3000))
      let objectStateCache = await frame.evaluate(() => {
        let objects = []
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
      this.socket.emit('log', {
        kind: 'error',
        message: err.message,
      })
    }
  }
}
