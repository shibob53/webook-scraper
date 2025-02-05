import { AppDataSource } from '../data-source'
import WebookAccount from '../entity/WebookAccount'
import { BrowserManager } from '../scraper/BrowserManager'
import { Crawler } from '../scraper/Crawler'

const crawler = new Crawler()

export const holdEvent = async (req, res) => {
  const url = req.body.url
  let nbAccountsToUse = req.body.nbAccountsToUse
  let io = req.app.get('io')
  if (!url) {
    res.status(400).send({
      message: 'URL is required',
    })
    return
  }

  if (!nbAccountsToUse) {
    nbAccountsToUse = 1
  }

  io.emit('log', {
    kind: 'info',
    message: 'holding event: ' + url + ' with ' + nbAccountsToUse + ' accounts',
  })

  const accountRepo = AppDataSource.getRepository(WebookAccount)
  const allAccounts = await accountRepo.find({
    take: 2,
  })

  const manager = await BrowserManager.getInstance(2, io)

  await manager.processAccounts(allAccounts, url)

  console.log('Done processing all accounts.')
  // If you wish, close the browser
  // await manager.closeBrowser()

  res.send('Event held')
}
