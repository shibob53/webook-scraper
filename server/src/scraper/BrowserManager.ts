import puppeteer, { Browser, BrowserContext, Page, Protocol } from 'puppeteer'
import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import pLimit from 'p-limit'
import { AppDataSource } from '../data-source'
import WebookAccount from '../entity/WebookAccount'
import { Server } from 'socket.io'
import { CrawlerSetting } from '../entity/CrawlerSetting'
import { Proxy } from '../entity/Proxy'
import { TicketGrab } from '../entity/TicketGrab'
import axios from 'axios'

// Add the stealth plugin
puppeteerExtra.use(StealthPlugin())

/**
 * A simple Mutex implementation.
 */
class Mutex {
  private _locked = false
  private _waiting: Array<() => void> = []

  async acquire(): Promise<() => void> {
    const ticket = new Promise<void>((resolve) => {
      if (!this._locked) {
        this._locked = true
        resolve()
      } else {
        this._waiting.push(resolve)
      }
    })
    await ticket
    return this.release.bind(this)
  }

  release() {
    if (this._waiting.length > 0) {
      const nextResolve = this._waiting.shift()
      nextResolve && nextResolve()
    } else {
      this._locked = false
    }
  }
}

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
  color?: string
}

export class BrowserManager {
  private static instance: BrowserManager
  private browser: Browser
  private concurrencyLimit: number
  // Global caches for Seats.io events
  private objectStateCache: Seat[] = []
  private categories: Category[] = []
  private socket: Server | null | undefined
  // Flag to indicate if the global seats have been extracted
  private seatsExtracted: boolean = false
  // Mutex to synchronize access to the seat cache
  private seatMutex: Mutex = new Mutex()
  // Optional settings instance – used to determine behavior
  private crawlerSetting?: CrawlerSetting
  private tickets: Array<Object>
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
    socket: Server | null | undefined,
    crawlerSetting?: CrawlerSetting
  ): Promise<BrowserManager> {
    if (!BrowserManager.instance) {
      const manager = new BrowserManager(concurrency)
      manager.socket = socket
      if (crawlerSetting) {
        manager.crawlerSetting = crawlerSetting
      }
      await manager.launchBrowser()
      BrowserManager.instance = manager
    }
    return BrowserManager.instance
  }

  /**
   * Launch the Puppeteer browser.
   */
  private async launchBrowser() {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-gpu',
    ]

    if (this.crawlerSetting && this.crawlerSetting.useProxies) {
      try {
        const proxy = await AppDataSource.getRepository(Proxy).findOne({
          where: { active: true },
        })
        if (proxy) {
          args.push(`--proxy-server=${proxy.ip}:${proxy.port}`)
          console.log(`Using proxy ${proxy.ip}:${proxy.port}`)
          this.socket?.emit('log', {
            kind: 'info',
            message: `Using proxy ${proxy.ip}:${proxy.port}`,
          })
        } else {
          console.warn('No active proxy found, proceeding without proxy.')
          this.socket?.emit('log', {
            kind: 'warning',
            message: 'No active proxy found, proceeding without proxy.',
          })
        }
      } catch (err) {
        console.error('Error fetching proxy:', err)
        this.socket?.emit('log', {
          kind: 'error',
          message: 'Error fetching proxy.',
        })
      }
    }

    const headless = false
    this.browser = await puppeteerExtra.launch({
      headless,
      args,
      ignoreDefaultArgs: ['--enable-automation'],
    })
  }

  /**
   * Close the browser.
   */
  public async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  /**
   * Process multiple accounts concurrently.
   * Each account loops until its held tickets reach crawlerSetting.maxTickets.
   * Before processing accounts, if the event uses Seats.io, perform a one-time global extraction.
   */
  public async processAccounts(accounts: WebookAccount[], eventUrl?: string) {
    if (
      !eventUrl &&
      this.crawlerSetting &&
      this.crawlerSetting.currentEventUrl
    ) {
      eventUrl = this.crawlerSetting.currentEventUrl
    }
    const maxTickets = this.crawlerSetting?.maxTickets ?? 5

    // One-time global extraction (if event uses Seats.io)
    const tempContext = await this.browser.createBrowserContext()
    const tempPage = await tempContext.newPage()
    if (await this.eventUsesSeatsio(tempPage)) {
      await this.extractCategories(tempPage)
      await this.extractSeats(tempPage)
      this.seatsExtracted = true
      console.log(
        'Global seats extracted:',
        JSON.stringify(this.objectStateCache)
      )
    }
    await tempContext.close()

    // Instead of mapping all accounts concurrently, wrap each in the concurrency limiter.
    const tasks = accounts.map((account) =>
      this.limit(async () => {
        let totalTicketsHeld = 0
        while (totalTicketsHeld < maxTickets) {
          const context = await this.browser.createBrowserContext()
          const page = await context.newPage()

          page.setRequestInterception(true)
          page.on('request', (request) => {
            // allow default-poster_1x1.png
            if (request.url().includes('default-poster_1x1.png')) {
              return request.continue()
            }

            if (['image', 'font', 'video'].includes(request.resourceType())) {
              return request.abort()
            }

            // block clarity
            if (
              request.url().includes('clarity') ||
              request.url().includes('fullstory')
            ) {
              request.abort()
            } else {
              request.continue()
            }
          })

          await this.restoreCookies(account, context)
          const isLoggedIn = await this.checkLoginStatus(page)
          if (!isLoggedIn) {
            console.log(`Account ${account.email} is not logged in.`)
            await this.loginAccount(page, account)
            await this.saveCookies(account, context)
          }
          console.log(`Account ${account.email} is logged in.`)
          console.log(`Account cookies: ${account.cookiesJson}`)

          const ticketsThisRound = await this.holdTickets(
            page,
            eventUrl,
            account
          )
          totalTicketsHeld += ticketsThisRound
          console.log(
            `Account ${account.email} now has held ${totalTicketsHeld} ticket(s).`
          )
          this.socket?.emit('log', {
            kind: 'info',
            message: `Account ${account.email} now has held ${totalTicketsHeld} ticket(s).`,
          })

          // Wait briefly before starting the next iteration.
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      })
    )

    await Promise.all(tasks)
  }

  /**
   * Restore cookies into the given incognito context.
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
      } catch (err: any) {
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
    await page.keyboard.press('Enter')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    console.log(`Logged in as ${account.email}`)
  }

  /**
   * Hold tickets by navigating through the event booking pages and selecting seats.
   * Returns the number of tickets held in this iteration.
   */
  private async holdTickets(
    page: Page,
    eventUrl: string,
    account: WebookAccount
  ): Promise<number> {
    // Accept any "Accept all" button.

    // Navigate to the event and booking page.
    await page.goto(eventUrl, { waitUntil: 'networkidle0' })
    await page.waitForSelector('a[data-testid="book-button"]', {
      timeout: 5000,
    })
    await page.goto(`${eventUrl}/book`, { waitUntil: 'networkidle0' })
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
    await new Promise((resolve) => setTimeout(resolve, 100))
    const dayButtonSelector = 'button[name="day"]:not([disabled])'
    try {
      // Wait for the selector to be visible.
      await page.evaluate((selector) => {
        const el = document.querySelector(selector)
        if (el) {
          el.scrollIntoView({ block: 'center', inline: 'center' })
          ;(el as HTMLElement).click()
        }
      }, dayButtonSelector)
      this.socket?.emit('log', {
        kind: 'warning',
        message:
          'Current Event has multiple dates, selecting the most recent one.',
      })
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await page.click('[data-testid="ticketing_calendar_to_tickets_button"]')
    } catch (err) {
      console.log('Current Event has only one date')
      this.socket?.emit('log', {
        kind: 'info',
        message: 'Current Event has only one date',
      })
    }

    let ticketGrab: TicketGrab | null = null
    let ticketsGrabbed = 0
    if (await this.eventUsesSeatsio(page)) {
      const grabResult = await this.holdTicketsAndCreateGrabs(
        page,
        eventUrl,
        account
      )
      if (grabResult && grabResult.grabbedSeats) {
        ticketGrab = grabResult
        ticketsGrabbed = grabResult.grabbedSeats.length
      }
    } else {
      const nonIframeResult = await this.holdTicketsNonIframe(
        page,
        eventUrl,
        account
      )
      ticketsGrabbed = nonIframeResult.ticketCount
      ticketGrab = await this.createTicketGrabNonIframe(eventUrl, account, {
        ticket: nonIframeResult.cheapestTicket,
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
    await this.acceptTerms(page, ticketGrab)
    return ticketsGrabbed
  }

  /**
   * For Seats.io events: select seats from the shared global cache (synchronized by a mutex)
   * using your filtering method to ensure only free seats are selected.
   */
  private async holdTicketsIframe(
    page: Page
  ): Promise<{ selectedSeats: string[]; details: any[] }> {
    // Ensure categories are loaded.
    if (this.categories.length === 0) {
      await this.extractCategories(page)
    }
    // Use the mutex to synchronize access to the seat cache.
    const release = await this.seatMutex.acquire()
    let selectedSeats: string[] = []
    let details: any[] = []
    try {
      // If the cache is empty, refresh it.
      if (this.objectStateCache.length === 0) {
        await this.extractSeats(page)
      }
      // Apply filtering: only keep seats that are free and pass price criteria.
      this.objectStateCache = this.objectStateCache.filter((seat) => {
        const cat = this.categories.find((c) => c.key === seat.categoryKey)
        if (!cat) return false
        if (
          this.crawlerSetting?.minPrice !== undefined &&
          cat.price < this.crawlerSetting.minPrice
        )
          return false
        if (
          this.crawlerSetting?.maxPrice !== undefined &&
          cat.price > this.crawlerSetting.maxPrice
        )
          return false
        return seat.status === 'free'
      })
      // Determine the batch size.
      const batchSize = Math.min(
        this.crawlerSetting?.maxTickets ?? 5,
        this.objectStateCache.length
      )
      const seatsToSelect = this.objectStateCache.slice(0, batchSize)
      selectedSeats = seatsToSelect.map((seat) => seat.seatId)
      // Remove the selected seats from the global cache.
      this.objectStateCache = this.objectStateCache.filter(
        (seat) => !selectedSeats.includes(seat.seatId)
      )
      console.log(`Selecting seats: ${JSON.stringify(selectedSeats)}`)
      details = seatsToSelect.map((seat) => {
        const cat = this.categories.find((c) => c.key === seat.categoryKey)
        return {
          seatId: seat.seatId,
          label: cat ? cat.label : null,
          price: cat ? cat.price : null,
          color: cat ? cat.color : null,
        }
      })
    } finally {
      release()
    }
    // Now call the Seats.io function on the page.
    await page.evaluate((seats) => {
      // @ts-ignore: assuming seatsio is available globally in the page context
      seatsio.charts[0].trySelectObjects(seats)
    }, selectedSeats)
    return { selectedSeats, details }
  }

  /**
   * For Seats.io events: create a TicketGrab from the selected seats.
   */
  private async holdTicketsAndCreateGrabs(
    page: Page,
    eventUrl: string,
    account: WebookAccount
  ): Promise<TicketGrab | null> {
    let selectedSeats: string[] = []
    let details: any[] = []
    if (await this.eventUsesSeatsio(page)) {
      const res = await this.holdTicketsIframe(page)
      selectedSeats = res.selectedSeats
      details = res.details
    } else {
      await this.holdTicketsNonIframe(page, eventUrl, account)
    }
    try {
      const grabRepo = AppDataSource.getRepository(TicketGrab)
      const grab = new TicketGrab()
      grab.eventUrl = eventUrl
      grab.grabbedSeats = selectedSeats ? JSON.stringify(selectedSeats) : null
      grab.seatDetails = details ? JSON.stringify(details) : null
      grab.isCategory = !selectedSeats || selectedSeats.length === 0
      grab.isSeat = selectedSeats && selectedSeats.length > 0
      grab.accountId = account.id
      console.log(`Saved grab for account ${account.id} on event ${eventUrl}`)
      await grabRepo.save(grab)
      return grab
    } catch (saveError) {
      console.error('Error saving ticket grab:', saveError)
      this.socket?.emit('log', {
        kind: 'error',
        message: 'Failed to save ticket grab.',
      })
      return null
    }
  }

  /**
   * For non-Seats.io events: click the appropriate ticket buttons.
   */
  private async holdTicketsNonIframe(
    page: Page,
    eventUrl: string,
    account: WebookAccount
  ): Promise<{ cheapestTicket: any; ticketCount: number }> {
    const tickets = await this.getEventTickets(eventUrl, account, page)
    console.log('Tickets:', tickets)
    const cheapestTicket = tickets.reduce((prev, current) =>
      prev.price < current.price ? prev : current
    )
    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log(`[data-ticket-name="${cheapestTicket.title}"]`)
    for (let i = 0; i < 5; i++) {
      await page.click(
        `button[data-ticket-name="${cheapestTicket.title}"]:nth-of-type(2)`
      )
    }
    return { cheapestTicket, ticketCount: 5 }
  }

  /**
   * For non-Seats.io events: create a TicketGrab record.
   */
  private async createTicketGrabNonIframe(
    eventUrl: string,
    account: WebookAccount,
    ticketDetails: any
  ): Promise<TicketGrab | null> {
    try {
      const grabRepo = AppDataSource.getRepository(TicketGrab)
      const grab = new TicketGrab()
      grab.eventUrl = eventUrl
      grab.grabbedSeats = null
      grab.seatDetails = JSON.stringify(ticketDetails)
      grab.isCategory = true
      grab.isSeat = false
      grab.accountId = account.id
      console.log(
        `Saved non-iframe grab for account ${account.id} on event ${eventUrl}`
      )
      await grabRepo.save(grab)
      return grab
    } catch (saveError) {
      console.error('Error saving non-iframe ticket grab:', saveError)
      this.socket?.emit('log', {
        kind: 'error',
        message: 'Failed to save non-iframe ticket grab.',
      })
      return null
    }
  }

  /**
   * Check if the event page uses Seats.io.
   */
  private async eventUsesSeatsio(page: Page): Promise<boolean> {
    try {
      await page.waitForSelector('[title="seating chart"]', { timeout: 1000 })
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Get event tickets from the API.
   */
  private async getEventTickets(
    eventUrl: string,
    account?: WebookAccount,
    page?: Page | null | undefined
  ) {
    if (this.tickets) return this.tickets
    const url = new URL(eventUrl)
    const pathParts = url.pathname.split('/')
    const eventsIndex = pathParts.indexOf('events')
    if (eventsIndex !== -1 && pathParts.length > eventsIndex + 1) {
      const eventSlug = pathParts[eventsIndex + 1]
      let cookiesObj = JSON.parse(account!.cookiesJson)
      cookiesObj = JSON.parse(account!.cookiesJson)

      const jwt = cookiesObj.find((c: any) => c.name === 'token')
      const data = await axios.get(
        `https://api.webook.com/api/v2/event-detail/${eventSlug}?lang=en&visible_in=rs`,
        {
          headers: {
            Authorization: `Bearer ${jwt.value}`,
            Token:
              'e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2',
          },
        }
      )
      const tickets = []
      for (const ticket of data.data.data.event_tickets) {
        if (
          this.crawlerSetting &&
          this.crawlerSetting.minPrice &&
          parseInt(ticket.price) < this.crawlerSetting.minPrice
        ) {
          continue
        }
        if (
          this.crawlerSetting &&
          this.crawlerSetting.maxPrice &&
          parseInt(ticket.price) > this.crawlerSetting.maxPrice
        ) {
          continue
        }
        tickets.push(ticket)
      }

      this.tickets = tickets
      return tickets
    } else {
      console.error('Event slug not found')
      return []
    }
  }

  /**
   * Check purchase status after a hold token expires.
   */
  public async checkHoldTokens(): Promise<void> {
    try {
      const grabRepo = AppDataSource.getRepository(TicketGrab)
      const grabs = await grabRepo.find()
      const now = new Date()
      for (const grab of grabs) {
        const minutesElapsed =
          (now.getTime() - new Date(grab.createdAt).getTime()) / 60000
        if (minutesElapsed >= 10) {
          const purchased = false // Assume not purchased.
          if (!purchased) {
            console.log(
              `Hold token expired for TicketGrab ${grab.id}, deleting record.`
            )
            await grabRepo.remove(grab)
            this.socket?.emit('log', {
              kind: 'info',
              message: `TicketGrab ${grab.id} expired and deleted.`,
            })
          }
        }
      }
    } catch (err) {
      console.error('Error checking hold tokens:', err)
      this.socket?.emit('log', {
        kind: 'error',
        message: 'Error checking hold tokens.',
      })
    }
  }

  /**
   * Check if the event is purchased.
   */
  public async isEventPurchased(
    eventUrl: string,
    account: WebookAccount
  ): Promise<boolean> {
    const url = new URL(eventUrl)
    const pathParts = url.pathname.split('/')
    const eventsIndex = pathParts.indexOf('events')
    if (eventsIndex !== -1 && pathParts.length > eventsIndex + 1) {
      const eventSlug = pathParts[eventsIndex + 1]
      const cookiesObj = JSON.parse(account.cookiesJson)
      const jwt = cookiesObj.find((c: any) => c.name === 'token')
      const data = await axios.get(
        'https://api.webook.com/api/v2/user/booking-history?lang=en&organization',
        {
          headers: {
            Authorization: `Bearer ${jwt.value}`,
            Token:
              'e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2',
          },
        }
      )

      // data.data.orders is an array of orders
      // each order have an event object with a slug property
      // if the slug is equal to the eventSlug, the event is purchased

      return data.data.orders.some(
        (order: any) => order.event.slug === eventSlug
      )
    } else {
      console.error('Event slug not found')
      return false
    }
  }

  /**
   * Accept the ticketing terms and proceed to payment.
   * Waits for navigation to capture the payment URL, then closes the context.
   */
  private async acceptTerms(page: Page, ticketGrab: TicketGrab | null) {
    const goToSummaryButtonSelector =
      'button[data-testid="ticketing_tickets_go_to_summary_button"]'
    await page.click(goToSummaryButtonSelector)

    await page.waitForSelector(
      'input[data-testid="ticketing_summary_terms_checkbox"]',
      {
        timeout: 60000,
      }
    )

    await page.evaluate(() => {
      document
        .querySelectorAll('input[type="checkbox"]')
        .forEach((el: HTMLInputElement) => el.click())
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const proceedToPaymentButtonSelector =
      '[data-testid="ticketing_summary_proceed_to_payment"]'
    const currentUrl = page.url()
    await page.click(proceedToPaymentButtonSelector)

    let paymentUrl = currentUrl
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout: 15000,
      })
      paymentUrl = page.url()
    } catch (err) {
      // If navigation timeout occurs, wait a bit longer and get URL
      await new Promise((resolve) => setTimeout(resolve, 5000))
      paymentUrl = page.url()
    }

    if (ticketGrab) {
      try {
        if (paymentUrl === currentUrl) {
          await AppDataSource.getRepository(TicketGrab).remove(ticketGrab)
          this.socket?.emit('log', {
            kind: 'warning',
            message: 'Payment page did not load; ticket grab removed.',
          })
        } else {
          ticketGrab.paymentUrl = paymentUrl
          await AppDataSource.getRepository(TicketGrab).save(ticketGrab)
          this.socket?.emit('log', {
            kind: 'info',
            message: 'Proceeded to payment: ' + paymentUrl,
          })
        }
        // Only close the context after DB operations are complete
        await page.browserContext().close()
      } catch (error) {
        console.error('Error saving payment URL:', error)
        this.socket?.emit('log', {
          kind: 'error',
          message: 'Failed to save payment URL: ' + error.message,
        })
        // Still close the context even if save fails
        await page.browserContext().close()
      }
    } else {
      this.socket?.emit('log', {
        kind: 'info',
        message: 'Proceeded to payment: ' + paymentUrl,
      })
      await page.browserContext().close()
    }
  }

  /**
   * Extract seating categories from the seating chart iframe.
   */
  private async extractCategories(page: Page) {
    try {
      await page.waitForSelector('[title="seating chart"]', { timeout: 60000 })
      const iframeElement = await page.$('iframe[title="seating chart"]')
      if (!iframeElement) {
        throw new Error('Seating chart iframe not found')
      }
      const frame = await iframeElement.contentFrame()
      await frame.waitForSelector('#chartContainer', { timeout: 60000 })
      await new Promise((resolve) => setTimeout(resolve, 3000))
      let categories: Category[] = await frame.evaluate(() => {
        let objects: Category[] = []
        // @ts-ignore: assuming 'chart' is available in the iframe context
        chart.categories.categories.forEach((category: any) => {
          if (
            category.categoryPricing &&
            category.categoryPricing.categoryPricing
          ) {
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
      if (this.crawlerSetting) {
        if (this.crawlerSetting.minPrice !== undefined) {
          categories = categories.filter(
            (c) => c.price >= this.crawlerSetting.minPrice
          )
        }
        if (this.crawlerSetting.maxPrice !== undefined) {
          categories = categories.filter(
            (c) => c.price <= this.crawlerSetting.maxPrice
          )
        }
      }
      this.categories = categories
    } catch (err: any) {
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
      let objectStateCache: Seat[] = await frame.evaluate(() => {
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
      if (
        this.crawlerSetting &&
        (this.crawlerSetting.minPrice || this.crawlerSetting.maxPrice)
      ) {
        objectStateCache = objectStateCache.filter((seat) => {
          const cat = this.categories.find((c) => c.key === seat.categoryKey)
          if (!cat) return false
          if (
            this.crawlerSetting.minPrice !== undefined &&
            cat.price < this.crawlerSetting.minPrice
          )
            return false
          if (
            this.crawlerSetting.maxPrice !== undefined &&
            cat.price > this.crawlerSetting.maxPrice
          )
            return false
          return true
        })
      }
      this.objectStateCache = objectStateCache
    } catch (err: any) {
      console.error('Error extracting seats:', err)
      this.socket?.emit('log', { kind: 'error', message: err.message })
    }
  }

  /**
   * Helper method to shuffle an array.
   */
  private shuffleArray<T>(array: T[]): T[] {
    const arr = array.slice()
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  public eventHasTickets(url: string): boolean {
    return false
  }
}
