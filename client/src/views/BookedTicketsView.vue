<script lang="ts" setup>
import { defineComponent, h, onMounted, ref, onUnmounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/vue-table'
import { EllipsisVertical } from 'lucide-vue-next'
import { useTicketGrabsStore } from '@/stores/grab'

// Define the shape of a TicketGrab record matching the entity.
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

const store = useTicketGrabsStore()

// Dummy data generator for demonstration purposes.
const getData = () => {
  store.fetchTicketGrabs()
}

/**
 * CountdownTimer component
 * Receives a "createdAt" Date prop and displays the remaining time until 10 minutes after creation.
 */
const CountdownTimer = defineComponent({
  name: 'CountdownTimer',
  props: {
    createdAt: {
      type: Date,
      required: true,
    },
  },
  setup(props) {
    const remaining = ref(0)
    const calculateRemaining = () => {
      // Calculate the end time (10 minutes after creation)
      const endTime = new Date(props.createdAt).getTime() + 10 * 60 * 1000
      const diff = endTime - Date.now()
      return diff > 0 ? diff : 0
    }
    remaining.value = calculateRemaining()

    const timer = setInterval(() => {
      remaining.value = calculateRemaining()
    }, 1000)

    onUnmounted(() => {
      clearInterval(timer)
    })

    return { remaining }
  },
  render() {
    const totalSeconds = Math.floor(this.remaining / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return h('span', `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`)
  },
})

// Define the columns for the TicketGrab DataTable.
const columns: ColumnDef<TicketGrab>[] = [
  {
    id: 'id',
    header: () => h('span', 'ID'),
    cell: (props) => h('span', props.row.original.id),
  },
  {
    id: 'eventUrl',
    header: () => h('span', 'Event URL'),
    cell: (props) => {
      const url = props.row.original.eventUrl
      return h(
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 underline font-bold',
        },
        'visit',
      )
    },
  },
  {
    id: 'paymentUrl',
    header: () => h('span', 'Payment URL'),
    cell: (props) => {
      const url = props.row.original.paymentUrl
      return url
        ? h(
            'a',
            {
              href: url,
              target: '_blank',
              rel: 'noopener noreferrer',
              class: 'text-primary underline font-bold',
            },
            'pay',
          )
        : h('span', 'N/A')
    },
  },
  {
    id: 'grabbedSeats',
    header: () => h('span', 'Grabbed Seats'),
    cell: (props) => {
      let seats: string[] = []
      try {
        if (props.row.original.grabbedSeats) {
          seats = JSON.parse(props.row.original.grabbedSeats)
        }
      } catch (error) {
        seats = [props.row.original.grabbedSeats]
      }
      return h('span', seats.join(', '))
    },
  },
  {
    id: 'seatDetails',
    header: () => h('span', 'Seat Details'),
    cell: (props) => {
      let details = ''
      try {
        if (props.row.original.seatDetails) {
          const parsed = JSON.parse(props.row.original.seatDetails)
          if (Array.isArray(parsed)) {
            details = parsed.map((d: any) => d.label).join(', ')
          } else {
            details = JSON.stringify(parsed)
          }
        }
      } catch (error) {
        details = props.row.original.seatDetails || ''
      }
      return h('span', details || 'N/A')
    },
  },
  {
    id: 'accountId',
    header: () => h('span', 'Account ID'),
    cell: (props) => h('span', props.row.original.accountId.toString()),
  },
  {
    id: 'countdown',
    header: () => h('span', 'Countdown Timer'),
    cell: (props) => h(CountdownTimer, { createdAt: props.row.original.createdAt }),
  },
  {
    id: 'actions',
    header: () => h('span', 'Actions'),
    cell: (props) =>
      h('div', [
        h(
          Button,
          {
            onClick: () => console.log('Action clicked for TicketGrab ID:', props.row.original.id),
            variant: 'ghost',
          },
          () => h(EllipsisVertical),
        ),
      ]),
  },
]

// Local data store for TicketGrab records.
const data = ref<TicketGrab[]>([])

onMounted(async () => {
  store.fetchTicketGrabs()
  data.value = store.ticketGrabs
  console.log('TicketGrabs:', data.value)
})

const onRowSelected = (selected: TicketGrab[]) => {
  console.log('Selected rows:', selected)
}
</script>

<template>
  <DashboardLayout title="Ticket Grabs">
    <DataTable :columns="columns" :data="data" @update:selected="onRowSelected" />
  </DashboardLayout>
</template>

<style scoped>
/* Add any custom styles here */
</style>
