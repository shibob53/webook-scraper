import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  Relation,
} from 'typeorm'
import { CrawlerSetting } from './CrawlerSetting'

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
}
