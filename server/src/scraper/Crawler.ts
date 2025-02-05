import { AppDataSource } from '../data-source'
import WebookAccount from '../entity/WebookAccount'
import { BrowserManager } from './BrowserManager'

export class Crawler {
  browserManager: BrowserManager
  constructor() {
    this.browserManager = new BrowserManager()
  }

  // Qq-123123123
  // API Token: e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2
  public async holdEvent(url: string, nbAccountsToUse: number) {
    const totalAccountsPossible = await AppDataSource.getRepository(
      WebookAccount
    ).count()

    if (nbAccountsToUse > totalAccountsPossible) {
      return
    }

    // const session = await this.browserManager.getSession()
    // const session2 = await this.browserManager.createSession()
    // const session3 = await this.browserManager.createSession()

    // session.loadNAccounts(nbAccountsToUse)

    // session2.loadAccounts([
    //   'raed8754@postm.net',
    //   'yasir1417@postm.net',
    //   'rafeeq5030@postm.net',
    // ])

    // session3.loadAccounts([
    //   'adil6193@postm.net',
    //   'haitham7187@postm.net',
    //   'nawaf9438@postm.net',
    //   'ismail1546@postm.net',
    // ])

    // session1.setEventUrl(
    // 'https://webook.com/en/events/saudi-brazilian-cultural-exchange-conexao'
    // )
    // await session1.holdTickets()
  }

  public async stop() {
    // await this.browserManager.clearSession()
  }
}
