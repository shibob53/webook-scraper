<script lang="ts" setup>
import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Divide } from 'lucide-vue-next'
import { h, onMounted, ref } from 'vue'

interface BookedTicket {
  id: number
  held_objects: string[]
  event_url: string
  hold_token: string
  hold_expires_at: Date
  account_email: string
}

const data = ref<BookedTicket[]>([])

const getData = (): Promise<BookedTicket[]> => {
  return new Promise((resolve) => {
    resolve([
      {
        id: 1,
        event_url: 'https://example.com',
        hold_token: '123',
        held_objects: ['B5-O-15', 'B5-O-13'],
        // current date + 10 mins
        hold_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        account_email: 'test@test.com',
      },
      {
        id: 2,
        event_url: 'https://example.com',
        hold_token: '123',
        held_objects: ['B5-O-15'],
        // current date + 10 mins
        hold_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        account_email: 'test2@example.com',
      },
    ])
  })
}

const colums: ColumnDef<BookedTicket>[] = [
  {
    id: 'id',
    header: () => h('span', 'ID'),
    cell: (props) => h('span', props.row.original.id),
  },
  {
    id: 'account_email',
    header: () => h('span', 'Account email'),
    cell: (props) => h('span', props.row.original.account_email),
  },
  {
    id: 'event_url',
    header: () => h('span', 'Event URL'),
    cell: (props) => h('a', { href: props.row.original.event_url }, props.row.original.event_url),
  },
  {
    id: 'held_objects',
    header: () => h('span', 'Held Seats'),
    cell: (props) => h('span', props.row.original.held_objects.join(', ')),
  },
  {
    id: 'hold_token',
    header: () => h('span', 'Hold token'),
    cell: (props) => h('span', props.row.original.hold_token),
  },
  {
    id: 'hold_expires_at',
    header: () => h('span', 'Hold expires at'),
    cell: (props) => h('span', props.row.original.hold_expires_at.toDateString()),
  },
  {
    id: 'actions',
    header: () => h('span', 'Actions'),
    cell: (props) =>
      h('div', [h(Button, { onClick: () => console.log('clicked') }, () => h(Divide))]),
  },
]

onMounted(async () => {
  data.value = await getData()

  console.log(data.value)
})
</script>

<template>
  <DashboardLayout title="Booked tickets">
    <DataTable :columns="colums" :data="data" />
  </DashboardLayout>
</template>

<style></style>
