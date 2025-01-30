import BrowserManager from './BrowserWindowManager'

export class Crawler {
  browserManager: BrowserManager
  constructor() {
    console.log('Crawler')
  }

  public async start() {
    this.browserManager = new BrowserManager()
    await this.browserManager.createSession()
  }

  public async stop() {
    await this.browserManager.clearSession()
  }
}
