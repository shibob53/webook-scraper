import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm'
import { User } from './User'

@Entity('queued_events')
export class QueuedEvent {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  url: string

  @Column({ nullable: false })
  userId: number

  @Column({ nullable: false })
  limit: number

  @Column({ nullable: false })
  status: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>
}
