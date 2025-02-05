import { defineStore } from 'pinia'
import { io, type Socket } from 'socket.io-client'
import { ref } from 'vue'
type Log = { kind: 'error' | 'info' | 'warning'; message: string }
type Event = {
  name: string | null | undefined
  url: string
}
type TicketsBooked = { event: Event; email: string; seatIds: string[]; checkoutUrl: string }
type OwnedTicket = { event: Event; seatIds: string[] }
export const useSocket = defineStore('socket', () => {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const logs = ref<Log[]>([])
  const ticketsBooked = ref<TicketsBooked[]>([])

  function connect() {
    socket.value = io('http://localhost:3000')

    socket.value.on('log', (log: Log) => {
      logs.value.push(log)
    })

    socket.value.on('tickets-booked', (data: TicketsBooked) => {
      ticketsBooked.value.push(data)
    })

    // new ticket buyed
    socket.value.on('ticket-bought', (data: TicketsBooked) => {
      console.log('Ticket bought:', data)
    })
  }

  return {
    socket,
    isConnected,
    logs,
    connect,
  }
})
