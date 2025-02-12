import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToOne,
  Relation,
  JoinColumn,
} from 'typeorm'
import { User } from './User'

@Entity('crawler_setting')
export class CrawlerSetting {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  userId: number

  @Column({ nullable: true })
  currentEventUrl: string

  @Column({ nullable: true })
  minPrice: number

  @Column({ nullable: true })
  maxPrice: number

  @Column({ nullable: true })
  maxTickets: number

  @Column({ nullable: true })
  ramdomMode: boolean

  @Column({ nullable: true })
  autoMode: boolean

  @Column({ nullable: true })
  // if true, the crawler will use proxies
  useProxies: boolean

  @Column({ nullable: true })
  // discord webhook to send notifications
  discordWebhook: string

  @Column({ default: 30 })
  // interval in minutes for the cron to run to check if even have new tickets
  recheckInterval: number

  @Column({ nullable: true })
  // if true, the crawler will stop
  isStopped: boolean

  @Column({ nullable: true })
  simConnections: number

  @Column({ nullable: true })
  lastUsedAccountId: number

  @OneToOne(() => User, (user) => user.crawlerSetting)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>
}
