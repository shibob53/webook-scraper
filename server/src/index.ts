import 'reflect-metadata'
import { AppDataSource } from './data-source'
import { User } from './entity/User'
import express from 'express'
import home from './routes/home'
import settings from './routes/settings'
import crawler from './routes/crawler'
import proxies from './routes/proxies'
import accounts from './routes/accounts'
import user from './routes/user'
import grabs from './routes/grabs'
import owned from './routes/owned'
import cors from 'cors'
import { verifyToken } from './middlewares/auth'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import './jobs/checkHoldTokensJob'
// import './jobs/eventQueuedJobs'
import { BrowserManager } from './scraper/BrowserManager'
import { CrawlerSetting } from './entity/CrawlerSetting'

dotenv.config()

AppDataSource.initialize()
  .then(async () => {
    // console.log('Inserting a new user into the database...')
    // const user = new User()
    // user.firstName = 'Timber'
    // user.lastName = 'Saw'
    // user.age = 25
    // await AppDataSource.manager.save(user)
    // console.log('Saved a new user with id: ' + user.id)

    // console.log('Loading users from the database...')
    // const users = await AppDataSource.manager.find(User)
    // console.log('Loaded users: ', users)

    const app = express()
    const server = createServer(app)
    const io = new Server(server, {
      cors: {
        origin: '*',
      },
    })
    const PORT = 3000
    app.set('io', io)
    app.use(cors())
    app.use(express.json())
    app.use(home)
    app.use('/api/v1/user', user)
    app.use(verifyToken)
    app.use('/api/v1/crawler', crawler)
    app.use('/api/v1/settings', settings)
    app.use('/api/v1/proxies', proxies)
    app.use('/api/v1/webook-accounts', accounts)
    app.use('/api/v1/ticket-grabs', grabs)
    app.use('/api/v1/owned', owned)

    server.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`)
    })

    io.on('connection', (socket) => {
      console.log('a user connected')
      socket.on('disconnect', () => {
        console.log('user disconnected')
      })

      socket.on('scraper:stop', async (settings) => {
        console.log('scraper:stop', settings)
        const repo = AppDataSource.getRepository(CrawlerSetting)
        settings = await repo.findOneBy({ userId: settings.userId })
        const manager = BrowserManager.getManager()
        manager.stop()

        // update settings
        settings.isStopped = true
        await repo.save(settings)
      })
    })
  })
  .catch((error) => console.log(error))
