import { Request, Response } from 'express'
import { User } from '../entity/User'
import { AppDataSource } from '../data-source'
import { OwnedTickets } from '../entity/OwnedTickets'
import { TicketGrab } from '../entity/TicketGrab'

export const moveToOwned = async (
  req: Request & { user: User | undefined },
  res: Response
) => {
  const { grabId } = req.body
  const grabRepo = AppDataSource.getRepository(TicketGrab)
  const grab = await grabRepo.findOneBy({ id: grabId })

  if (grab) {
    const owned = new OwnedTickets()
    owned.accountId = grab.accountId
    owned.eventUrl = grab.eventUrl
    owned.grabbedSeats = grab.grabbedSeats
    owned.isCategory = grab.isCategory
    owned.seatDetails = grab.seatDetails

    AppDataSource.getRepository(OwnedTickets).save(owned)
  }

  res.json({ error: false })
}

export const list = async (
  req: Request & { user: User | undefined },
  res: Response
) => {
  const repo = AppDataSource.getRepository(OwnedTickets)
  const all = await repo.find()

  res.json(all)
}
