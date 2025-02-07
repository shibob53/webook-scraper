import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Add stealth plugin
puppeteerExtra.use(StealthPlugin())

puppeteerExtra
  .launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-gpu',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  })
  .then(async (browser) => {
    const context = browser.defaultBrowserContext()
    await context.overridePermissions('https://webook.com', [])
    const page = await browser.newPage()
    await page.goto('https://webook.com/en/login/')
    await page.waitForNetworkIdle()
    await page.evaluate(() => {
      const xpath = "//button[.//p[contains(text(), 'Accept all')]]"
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      const acceptButton = result.singleNodeValue
      if (acceptButton) {
        acceptButton.click()
      }
    })

    await page.type('input[name="email"]', 'ismail1546@postm.net')
    await page.type('input[name="password"]', 'Qq-123123123')
    await page.click('button[type="submit"]')
    await page.waitForNavigation()

    await page.goto(
      'https://webook.com/en/events/tamer-ashour-rs-25-tickets-657480/book'
    )
    await page.waitForSelector('[title="seating chart"]', { timeout: 60000 })

    const iframeElement = await page.$('iframe[title="seating chart"]')
    const frame = await iframeElement.contentFrame()

    // Instead of waiting for navigation, wait for a known selector inside the iframe.
    await frame.waitForSelector('#chartContainer', { timeout: 60000 }) // Replace with an actual selector from the iframe.

    // Short delay if needed.
    await new Promise((resolve) => setTimeout(resolve, 4000))

    let objectStateCache = await frame.evaluate(() => {
      console.log(chart)
      let objects = []
      for (let [key, value] of chart.objectStateCache.entries()) {
        objects.push({
          status: key.status,
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

    console.log(categories)
    // browser.close()
  })
