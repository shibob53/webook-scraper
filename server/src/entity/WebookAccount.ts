import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Relation,
  JoinColumn,
} from 'typeorm'
import { User } from './User'

@Entity('webook_accounts')
export default class WebookAccount {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column({ nullable: true })
  jwt: string

  @Column({ nullable: true })
  jwtExpiresIn: number

  @Column({ type: 'text', nullable: true })
  cookiesJson: string

  @Column({ default: false })
  disabled: boolean

  @Column({
    default: 'e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2',
  })
  apiToken: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>
}
