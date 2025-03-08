import { BrowserManager } from './BrowserManager'

/**
 * Background seat extraction service
 * Regularly updates the global seat cache in the background
 */
export class BackgroundSeatsExtractor {
  private manager: BrowserManager
  private intervalId: NodeJS.Timeout | null = null
  private extractionIntervalMinutes: number
  private isRunning: boolean = false
  private currentEventUrl: string | null = null

  /**
   * Creates a new background extractor service
   *
   * @param manager The browser manager instance
   * @param extractionIntervalMinutes How often to extract seats (in minutes)
   */
  constructor(manager: BrowserManager, extractionIntervalMinutes: number = 2) {
    this.manager = manager
    this.extractionIntervalMinutes = extractionIntervalMinutes
  }

  /**
   * Start the background extraction for a specific event URL
   *
   * @param eventUrl The event URL to extract seats from
   * @returns Promise that resolves when the extraction service is started
   */
  public async start(eventUrl: string): Promise<void> {
    if (this.isRunning) {
      if (this.currentEventUrl === eventUrl) {
        console.log('Background extraction already running for this event')
        this.manager.getSocket()?.emit('log', {
          kind: 'info',
          message: 'Background seat extraction already running for this event',
        })
        return
      } else {
        // Stop the current extraction if running for a different event
        await this.stop()
      }
    }

    this.currentEventUrl = eventUrl
    this.isRunning = true

    // Run initial extraction immediately
    await this.performExtraction(eventUrl)

    // Then set up the interval
    const intervalMs = this.extractionIntervalMinutes * 60 * 1000
    this.intervalId = setInterval(async () => {
      if (this.manager.isStopped) {
        this.stop()
        return
      }

      await this.performExtraction(eventUrl)
    }, intervalMs)

    console.log(
      `Started background seat extraction every ${this.extractionIntervalMinutes} minutes`
    )
    this.manager.getSocket()?.emit('log', {
      kind: 'info',
      message: `Started background seat extraction every ${this.extractionIntervalMinutes} minutes`,
    })
  }

  /**
   * Stop the background extraction service
   */
  public async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    this.currentEventUrl = null

    console.log('Stopped background seat extraction')
    this.manager.getSocket()?.emit('log', {
      kind: 'info',
      message: 'Stopped background seat extraction',
    })
  }

  /**
   * Perform a single extraction cycle
   *
   * @param eventUrl The event URL to extract seats from
   */
  private async performExtraction(eventUrl: string): Promise<void> {
    try {
      console.log('Performing background seat extraction...')
      this.manager.getSocket()?.emit('log', {
        kind: 'info',
        message: 'Performing background seat extraction...',
      })

      const browser = this.manager.getBrowser()
      if (!browser) {
        throw new Error('Browser not initialized')
      }

      // Create a temporary context for extraction
      const tempContext = await browser.createBrowserContext()
      const tempPage = await tempContext.newPage()

      // Configure page for faster loading
      await tempPage.setRequestInterception(true)
      tempPage.on('request', (request) => {
        if (['image', 'font', 'video'].includes(request.resourceType())) {
          return request.abort()
        }
        if (
          request.url().includes('clarity') ||
          request.url().includes('fullstory') ||
          request.url().includes('googlesyndication') ||
          request.url().includes('imasdk.googleapis.com')
        ) {
          request.abort()
        } else {
          request.continue()
        }
      })

      // Navigate to the event booking page
      await tempPage.goto(`${eventUrl}/book`, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      })

      // Check if event uses seats.io
      const usesSeatsio = await this.manager.eventUsesSeatsio(tempPage)

      if (usesSeatsio) {
        // For Seats.io events, refresh both categories and seats
        await this.manager.extractCategories(tempPage)
        await this.manager.extractSeats(tempPage)

        const freeSeatsCount = this.manager.getFreeSeatsCount()
        console.log(
          `Background extraction complete. Found ${freeSeatsCount} free seats.`
        )
        this.manager.getSocket()?.emit('log', {
          kind: 'info',
          message: `Background extraction complete. Found ${freeSeatsCount} free seats.`,
        })
      }

      // Close the temporary context
      await tempContext.close()
    } catch (error) {
      console.error('Error in background seat extraction:', error)
      this.manager.getSocket()?.emit('log', {
        kind: 'error',
        message: `Background seat extraction error: ${error.message}`,
      })
    }
  }
}
