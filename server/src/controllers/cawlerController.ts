import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import WebookAccount from '../entity/WebookAccount'
import { BrowserManager } from '../scraper/BrowserManager'
import { Crawler } from '../scraper/Crawler'
import { CrawlerSetting } from '../entity/CrawlerSetting'
import { User } from '../entity/User'

const crawler = new Crawler()

export const holdEvent = async (
  req: Request & { user: User },
  res: Response
) => {
  const resume = req.body.resume
  const settings = await AppDataSource.getRepository(CrawlerSetting).findOneBy({
    userId: req.user.id,
  })
  const url = settings?.currentEventUrl
  let nbAccountsToUse = settings?.simConnections
  console.log('nbAccountsToUse', nbAccountsToUse)
  let io = req.app.get('io')
  if (!url) {
    res.status(400).send({
      message: 'URL is required',
    })
    return
  }

  if (!nbAccountsToUse || nbAccountsToUse < 1) {
    nbAccountsToUse = 1
  }

  io.emit('log', {
    kind: 'info',
    message:
      'holding event: ' + url + ' with ' + nbAccountsToUse + ' connection(s)',
  })

  const accountRepo = AppDataSource.getRepository(WebookAccount)
  const allAccounts = await accountRepo.find()

  let manager = null
  if (BrowserManager.isInitialized()) {
    manager = BrowserManager.getManager()
  } else {
    manager = await BrowserManager.getInstance(nbAccountsToUse, io)
  }

  // manager.setIsStopped(false)
  // update settings
  settings.isStopped = false
  await AppDataSource.getRepository(CrawlerSetting).save(settings)
  await manager.updateSettings(settings)

  if (resume) {
    await manager.resume()
    await manager.processAccounts(allAccounts, url)
  } else {
    await manager.reset()
    await manager.processAccounts(allAccounts, url)
  }

  res.json({ message: 'Scraper started on event: ' + url })
}
