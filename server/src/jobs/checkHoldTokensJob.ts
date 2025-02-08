import cron from 'node-cron'
import { BrowserManager } from '../scraper/BrowserManager'
import { AppDataSource } from '../data-source'

// Schedule the job to run every minute.
cron.schedule('*/1 * * * *', async () => {
  try {
    console.log('Cron job: Checking for hold tokens...')
    const manager = await BrowserManager.getInstance(1, null, null)
    await manager.checkHoldTokens()
  } catch (err) {
    console.error('Error running checkHoldTokens job:', err)
  }
})
