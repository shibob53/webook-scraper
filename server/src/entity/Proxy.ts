import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  Relation,
  JoinColumn,
} from 'typeorm'
import { User } from './User'

@Entity('proxies')
export class Proxy {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  userId: number

  @Column({ nullable: false })
  ip: string

  @Column({ nullable: false })
  port: number

  @Column({ nullable: true })
  username?: string

  @Column({ nullable: true })
  password?: string

  @Column({ default: true })
  active: boolean

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>
}
