import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('owned_tickets')
export class OwnedTickets {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  eventUrl: string

  @Column({ type: 'text', nullable: true })
  grabbedSeats: string

  @Column({ nullable: true })
  isSeat: boolean

  @Column({ nullable: true })
  isCategory: boolean

  // Additional seat details (seatId, label, price, color) stored as JSON.
  @Column({ type: 'text', nullable: true })
  seatDetails: string

  @Column({ nullable: false })
  accountId: number

  @CreateDateColumn()
  createdAt: Date
}
