import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToOne,
  Relation,
} from 'typeorm'
import { User } from './User'

@Entity('crawler_setting')
export class CrawlerSetting {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userId: number

  @Column()
  currentEventUrl: string

  @Column()
  minPrice: number

  @Column()
  maxPrice: number

  @Column()
  maxTickets: number

  @Column()
  ramdomMode: boolean

  @Column()
  autoMode: boolean

  @OneToOne(() => User, (user) => user.crawlerSetting)
  user: Relation<User>
}
