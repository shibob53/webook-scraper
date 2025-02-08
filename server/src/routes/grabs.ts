import { Router } from 'express'
import {
  addTicketGrab,
  importTicketGrabs,
  updateTicketGrab,
  deleteTicketGrab,
  listTicketGrabs,
} from '../controllers/ticketGrabController'

const router = Router()

// GET /api/v1/ticket-grabs
// List all TicketGrab records.
router.get('/', listTicketGrabs)

// POST /api/v1/ticket-grabs
// Create a new TicketGrab.
router.post('/', addTicketGrab)

// POST /api/v1/ticket-grabs/import
// Bulk import TicketGrabs.
router.post('/import', importTicketGrabs)

// PUT /api/v1/ticket-grabs/:id
// Update a specific TicketGrab.
router.put('/:id', updateTicketGrab)

// DELETE /api/v1/ticket-grabs/:id
// Delete a specific TicketGrab.
router.delete('/:id', deleteTicketGrab)

export default router
