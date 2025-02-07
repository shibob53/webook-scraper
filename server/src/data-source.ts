import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from './entity/User'
import { CrawlerSetting } from './entity/CrawlerSetting'
import WebookAccount from './entity/WebookAccount'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'roo128T123@#]',
  database: 'webook_scraper',
  synchronize: true,
  logging: false,
  entities: [User, CrawlerSetting, WebookAccount],
  migrations: [],
  subscribers: [],
})
