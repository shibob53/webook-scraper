import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('ticket_grabs')
export class TicketGrab {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  eventUrl: string

  @Column({ nullable: true })
  paymentUrl: string

  // Raw grabbed seat IDs (stored as a JSON string).
  @Column({ type: 'text', nullable: true })
  grabbedSeats: string

  @Column({ nullable: true })
  isSeat: boolean

  @Column({ nullable: true })
  holdToken: string

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
