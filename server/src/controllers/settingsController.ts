import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { CrawlerSetting } from '../entity/CrawlerSetting'
import { User } from '../entity/User'
import { BrowserManager } from '../scraper/BrowserManager'

export const saveSettings = async (
  req: Request & { user: User | undefined },
  res: Response
) => {
  const user = req.user
  if (!user) {
    res.status(401).json({ message: 'No user on request' })
    return
  }

  const minPrice = req.body.minPrice
  const maxPrice = req.body.maxPrice
  const maxTickets = req.body.maxTickets
  const useProxies = req.body.useProxies
  const discordWebhook = req.body.discordWebhook
  const recheckInterval = req.body.recheckInterval
  const simConnections = req.body.simConnections
  const currentEventUrl = req.body.currentEventUrl
  //   const ramdomMode = req.body.ramdomMode // not used
  const repo = AppDataSource.getRepository(CrawlerSetting)
  const setting = await repo.findOneBy({ userId: user.id })

  if (!setting) {
    const newSetting = new CrawlerSetting()
    newSetting.userId = user.id
    newSetting.minPrice = minPrice
    newSetting.maxPrice = maxPrice
    newSetting.maxTickets = maxTickets
    newSetting.useProxies = useProxies
    newSetting.discordWebhook = discordWebhook
    newSetting.recheckInterval = recheckInterval
    newSetting.isStopped = true
    newSetting.simConnections = 1
    newSetting.lastUsedAccountId = -1
    newSetting.currentEventUrl = ''
    await repo.save(newSetting)
    res.json({ message: 'Settings saved' })
    return
  }

  setting.minPrice = minPrice
  setting.maxPrice = maxPrice
  setting.maxTickets = maxTickets
  setting.useProxies = useProxies
  setting.discordWebhook = discordWebhook
  setting.recheckInterval = recheckInterval
  setting.simConnections = simConnections
  setting.currentEventUrl = currentEventUrl

  await repo.save(setting)

  if (BrowserManager.isInitialized()) {
    const manager = BrowserManager.getManager()
    manager.updateSettings(setting)
  }

  res.json({ message: 'Settings updated' })
}

export const getSettings = async (
  req: Request & { user: User | undefined },
  res: Response
) => {
  const user = req.user
  if (!user) {
    res.status(401).json({ message: 'No user on request' })
    return
  }

  const repo = AppDataSource.getRepository(CrawlerSetting)
  const setting = user.crawlerSetting

  if (!setting) {
    res.status(404).json({ message: 'No settings found' })
    return
  }

  res.json(setting)
}
