import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { TicketGrab } from '../entity/TicketGrab'

/**
 * Create a new TicketGrab.
 * Expects: { eventUrl, paymentUrl?, grabbedSeats?, isSeat?, isCategory?, seatDetails?, accountId }
 */
const addTicketGrab = async (req: Request, res: Response) => {
  try {
    const {
      eventUrl,
      paymentUrl,
      grabbedSeats,
      isSeat,
      isCategory,
      seatDetails,
      accountId,
    } = req.body

    if (!eventUrl || accountId === undefined) {
      res
        .status(400)
        .json({ message: 'Event URL and Account ID are required.' })
      return
    }

    const ticketGrabRepo = AppDataSource.getRepository(TicketGrab)
    const ticketGrab = new TicketGrab()
    ticketGrab.eventUrl = eventUrl
    ticketGrab.paymentUrl = paymentUrl
    ticketGrab.grabbedSeats = grabbedSeats
    ticketGrab.isSeat = isSeat
    ticketGrab.isCategory = isCategory
    ticketGrab.seatDetails = seatDetails
    ticketGrab.accountId = accountId

    const savedTicketGrab = await ticketGrabRepo.save(ticketGrab)
    res.status(201).json({
      message: 'TicketGrab added successfully',
      ticketGrab: savedTicketGrab,
    })
    return
  } catch (error: any) {
    console.error('Error adding TicketGrab:', error)
    res
      .status(500)
      .json({ message: 'Error adding TicketGrab', error: error.message })
    return
  }
}

/**
 * Bulk import TicketGrabs.
 * Expects: { ticketGrabs: Array<{ eventUrl, paymentUrl?, grabbedSeats?, isSeat?, isCategory?, seatDetails?, accountId }> }
 */
const importTicketGrabs = async (req: Request, res: Response) => {
  try {
    const ticketGrabsData = req.body.ticketGrabs
    if (!Array.isArray(ticketGrabsData)) {
      res.status(400).json({ message: 'ticketGrabs should be an array.' })
      return
    }

    const ticketGrabRepo = AppDataSource.getRepository(TicketGrab)
    const ticketGrabsToSave = ticketGrabsData.map((data: any) => {
      const ticketGrab = new TicketGrab()
      ticketGrab.eventUrl = data.eventUrl
      ticketGrab.paymentUrl = data.paymentUrl
      ticketGrab.grabbedSeats = data.grabbedSeats
      ticketGrab.isSeat = data.isSeat
      ticketGrab.isCategory = data.isCategory
      ticketGrab.seatDetails = data.seatDetails
      ticketGrab.accountId = data.accountId
      return ticketGrab
    })

    const savedTicketGrabs = await ticketGrabRepo.save(ticketGrabsToSave)
    res.status(201).json({
      message: 'TicketGrabs imported successfully',
      ticketGrabs: savedTicketGrabs,
    })
    return
  } catch (error: any) {
    console.error('Error importing TicketGrabs:', error)
    res
      .status(500)
      .json({ message: 'Error importing TicketGrabs', error: error.message })
    return
  }
}

/**
 * Update a TicketGrab.
 * Expects TicketGrab ID in req.params.id and new values in req.body.
 */
const updateTicketGrab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      eventUrl,
      paymentUrl,
      grabbedSeats,
      isSeat,
      isCategory,
      seatDetails,
      accountId,
    } = req.body

    if (!id) {
      res.status(400).json({ message: 'TicketGrab ID is required.' })
      return
    }

    const ticketGrabRepo = AppDataSource.getRepository(TicketGrab)
    const ticketGrab = await ticketGrabRepo.findOne({
      where: { id: Number(id) },
    })
    if (!ticketGrab) {
      res.status(404).json({ message: 'TicketGrab not found.' })
      return
    }

    if (eventUrl !== undefined) ticketGrab.eventUrl = eventUrl
    if (paymentUrl !== undefined) ticketGrab.paymentUrl = paymentUrl
    if (grabbedSeats !== undefined) ticketGrab.grabbedSeats = grabbedSeats
    if (isSeat !== undefined) ticketGrab.isSeat = isSeat
    if (isCategory !== undefined) ticketGrab.isCategory = isCategory
    if (seatDetails !== undefined) ticketGrab.seatDetails = seatDetails
    if (accountId !== undefined) ticketGrab.accountId = accountId

    const updatedTicketGrab = await ticketGrabRepo.save(ticketGrab)
    res.status(200).json({
      message: 'TicketGrab updated successfully',
      ticketGrab: updatedTicketGrab,
    })
    return
  } catch (error: any) {
    console.error('Error updating TicketGrab:', error)
    res
      .status(500)
      .json({ message: 'Error updating TicketGrab', error: error.message })
    return
  }
}

/**
 * Delete a TicketGrab.
 * Expects TicketGrab ID in req.params.id.
 */
const deleteTicketGrab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ message: 'TicketGrab ID is required.' })
      return
    }

    const ticketGrabRepo = AppDataSource.getRepository(TicketGrab)
    const ticketGrab = await ticketGrabRepo.findOne({
      where: { id: Number(id) },
    })
    if (!ticketGrab) {
      res.status(404).json({ message: 'TicketGrab not found.' })
      return
    }

    await ticketGrabRepo.remove(ticketGrab)
    res.status(200).json({ message: 'TicketGrab deleted successfully' })
    return
  } catch (error: any) {
    console.error('Error deleting TicketGrab:', error)
    res
      .status(500)
      .json({ message: 'Error deleting TicketGrab', error: error.message })
    return
  }
}

/**
 * List all TicketGrabs.
 */
const listTicketGrabs = async (req: Request, res: Response) => {
  try {
    const ticketGrabRepo = AppDataSource.getRepository(TicketGrab)
    const ticketGrabs = await ticketGrabRepo.find()
    res.status(200).json({
      message: 'TicketGrabs fetched successfully',
      ticketGrabs,
    })
    return
  } catch (error: any) {
    console.error('Error listing TicketGrabs:', error)
    res
      .status(500)
      .json({ message: 'Error listing TicketGrabs', error: error.message })
    return
  }
}

export {
  addTicketGrab,
  importTicketGrabs,
  updateTicketGrab,
  deleteTicketGrab,
  listTicketGrabs,
}
