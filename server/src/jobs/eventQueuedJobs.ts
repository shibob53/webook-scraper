import cron from 'node-cron'
import axios from 'axios'
import { AppDataSource } from '../data-source'
import { QueuedEvent } from '../entity/QueuedEvent'
import { CrawlerSetting } from '../entity/CrawlerSetting'
import WebookAccount from '../entity/WebookAccount'
import { BrowserManager } from '../scraper/BrowserManager'

// A helper function to send a message to Discord using a webhook.
async function sendDiscordNotification(webhookUrl: string, message: string) {
  try {
    await axios.post(webhookUrl, { content: message })
    console.log('Discord notification sent.')
  } catch (error) {
    console.error('Error sending Discord notification:', error)
  }
}

// Schedule the cron job.
// In this example, the job runs every minute. You can adjust the schedule as needed.
cron.schedule('*/1 * * * *', async () => {
  console.log('Cron job: Checking for queued events...')
  const queuedEventRepo = AppDataSource.getRepository(QueuedEvent)
  // Retrieve all queued events. (You might want to filter by status if you later add statuses.)
  const queuedEvents = await queuedEventRepo.find()

  for (const event of queuedEvents) {
    console.log(
      `Processing queued event [ID: ${event.id}] for URL: ${event.url}`
    )

    try {
      // Retrieve the crawler settings for the user.
      const crawlerSettingRepo = AppDataSource.getRepository(CrawlerSetting)
      const crawlerSetting = await crawlerSettingRepo.findOne({
        where: { userId: event.userId },
      })

      if (!crawlerSetting) {
        console.warn(
          `No crawler setting found for user ${event.userId}. Skipping event ${event.id}.`
        )
        continue
      }

      // Retrieve the user's accounts. Here we use the event.limit to choose how many accounts.
      const accountRepo = AppDataSource.getRepository(WebookAccount)
      const accounts = await accountRepo.find({
        where: { disabled: false, user: { id: event.userId } },
        take: event.limit,
      })

      if (!accounts || accounts.length === 0) {
        console.warn(
          `No active accounts found for user ${event.userId}. Skipping event ${event.id}.`
        )
        continue
      }

      // Create (or get) a BrowserManager instance with the user's crawler settings.
      // For simplicity, we pass null for the socket.
      const manager = await BrowserManager.getInstance(
        event.limit,
        null,
        crawlerSetting
      )

      // Check if the BrowserManager captured a payment link.
      if (manager.eventHasTickets(event.url)) {
        // Process the event. This should attempt to hold the tickets.
        await manager.processAccounts(accounts, event.url)
        const paymentLink = manager.lastPaymentLink
        console.log(
          `Queued event ${event.id} processed successfully. Payment link: ${paymentLink}`
        )

        // Delete the queued event after successful processing.
        await queuedEventRepo.remove(event)

        // Send a Discord notification using the webhook from crawler settings.
        if (crawlerSetting.discordWebhook) {
          await sendDiscordNotification(
            crawlerSetting.discordWebhook,
            `Tickets for event ${event.url} have been held successfully.\nPayment Link: ${paymentLink}`
          )
        }
      } else {
        console.log(
          `Queued event ${event.id} processed but no payment link was captured.`
        )
      }
    } catch (error) {
      console.error(`Error processing queued event ${event.id}:`, error)
    }
  }
})
