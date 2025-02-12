import { defineStore } from 'pinia'
import { ref } from 'vue'

type OwnedTicket = {
  accountId: number
  createdAt: string
  id: number
  isCategory?: boolean
  eventName: string
  quantity: number
}

// Define the state interface.
const useOwned = defineStore('ownedTickets', () => {
  const tickets = ref<OwnedTicket[]>([])

  return {
    tickets,
  }
})
