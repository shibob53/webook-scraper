// src/stores/ticketGrabs.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { useUser } from './user' // Adjust the path to your user store if necessary

// Define the shape of a TicketGrab object.
export interface TicketGrab {
  id: number
  eventUrl: string
  paymentUrl?: string
  grabbedSeats?: string
  isSeat?: boolean
  isCategory?: boolean
  seatDetails?: string
  accountId: number
  createdAt: string // You can also use Date if you prefer
}

// Define the state interface.
interface TicketGrabsState {
  ticketGrabs: TicketGrab[]
  loading: boolean
  error: string | null
}

export const useTicketGrabsStore = defineStore('ticketGrabs', {
  state: (): TicketGrabsState => ({
    ticketGrabs: [],
    loading: false,
    error: null,
  }),

  actions: {
    // Fetch all TicketGrabs from the API.
    async fetchTicketGrabs() {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.get(import.meta.env.VITE_API_BASE + '/api/v1/ticket-grabs', {
          headers: { Authorization: `Bearer ${userStore.jwt}` },
        })
        // Assuming the response structure is: { ticketGrabs: [...] }
        this.ticketGrabs = response.data.ticketGrabs
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error fetching ticket grabs'
      } finally {
        this.loading = false
      }
    },

    // Add a new TicketGrab.
    // Expects a ticket grab object (without id and createdAt) to be passed.
    async addTicketGrab(grabData: Omit<TicketGrab, 'id' | 'createdAt'>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.post(
          import.meta.env.VITE_API_BASE + '/api/v1/ticket-grabs',
          grabData,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        // Assuming the response structure is: { ticketGrab: { ... } }
        this.ticketGrabs.push(response.data.ticketGrab)
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error adding ticket grab'
      } finally {
        this.loading = false
      }
    },

    // Update an existing TicketGrab.
    async updateTicketGrab(id: number, updatedData: Partial<TicketGrab>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.put(
          import.meta.env.VITE_API_BASE + `/api/v1/ticket-grabs/${id}`,
          updatedData,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        // Assuming the response structure is: { ticketGrab: { ... } }
        const updatedTicketGrab = response.data.ticketGrab
        const index = this.ticketGrabs.findIndex((tg) => tg.id === id)
        if (index !== -1) {
          this.ticketGrabs[index] = updatedTicketGrab
        }
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error updating ticket grab'
      } finally {
        this.loading = false
      }
    },

    // Delete a TicketGrab.
    async deleteTicketGrab(id: number) {
      this.loading = true
      try {
        const userStore = useUser()
        await axios.delete(import.meta.env.VITE_API_BASE + `/api/v1/ticket-grabs/${id}`, {
          headers: { Authorization: `Bearer ${userStore.jwt}` },
        })
        this.ticketGrabs = this.ticketGrabs.filter((tg) => tg.id !== id)
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error deleting ticket grab'
      } finally {
        this.loading = false
      }
    },

    // Import a list of TicketGrabs.
    // Expects an array of ticket grab objects (without id and createdAt) as the parameter.
    async importTicketGrabList(grabs: Array<Omit<TicketGrab, 'id' | 'createdAt'>>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.post(
          import.meta.env.VITE_API_BASE + '/api/v1/ticket-grabs/import',
          { ticketGrabs: grabs },
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        // Assuming the response structure is: { ticketGrabs: [ ... ] }
        this.ticketGrabs = [...this.ticketGrabs, ...response.data.ticketGrabs]
        this.error = null
      } catch (error: any) {
        this.error =
          error.response?.data?.message || error.message || 'Error importing ticket grab list'
      } finally {
        this.loading = false
      }
    },
  },

  getters: {
    // Example getter to return the total count of ticket grabs.
    ticketGrabCount: (state): number => state.ticketGrabs.length,
  },
})
