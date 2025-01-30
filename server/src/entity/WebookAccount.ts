import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('webhook_accounts')
export default class WebhookAccount {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  email: string

  @Column()
  password: string

  @Column()
  jwt: string

  @Column()
  tokenExpiresIn: number
}
