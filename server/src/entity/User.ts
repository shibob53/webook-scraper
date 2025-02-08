import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  Relation,
  OneToMany,
} from 'typeorm'
import { Proxy } from './Proxy'
import { CrawlerSetting } from './CrawlerSetting'
import { QueuedEvent } from './QueuedEvent'
import WebookAccount from './WebookAccount'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  username: string

  @Column()
  password: string

  @Column({ nullable: true })
  jwt: string

  @OneToOne(() => CrawlerSetting, (crawlerSetting) => crawlerSetting.user)
  crawlerSetting: Relation<CrawlerSetting>

  @OneToMany(() => QueuedEvent, (queuedEvent) => queuedEvent.user)
  queuedEvents: Relation<QueuedEvent>[]

  @OneToMany(() => Proxy, (proxy) => proxy.user)
  proxies: Relation<Proxy>[]

  @OneToMany(() => WebookAccount, (webookAccount) => webookAccount.user)
  webookAccounts: Relation<WebookAccount>[]
}
