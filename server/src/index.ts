import 'reflect-metadata'
import { AppDataSource } from './data-source'
import { User } from './entity/User'
import express from 'express'
import home from './routes/home'

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
    const PORT = 3000

    app.use(express.json())
    app.use(home)

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`)
    })
  })
  .catch((error) => console.log(error))
