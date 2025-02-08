<!-- src/components/ProxiesTable.vue -->
<script setup lang="ts">
import { computed, onMounted, ref, watchEffect, h } from 'vue'
import { useProxiesStore } from '@/stores/proxy'
import { createTable, getCoreRowModel, type ColumnDef } from '@tanstack/vue-table'
import ProxyActionsCell from './ProxyActionCell.vue'

/**
 * Define the ProxyItem type matching your store data.
 */
interface ProxyItem {
  id: number
  ip: string
  port: number
  username?: string
  password?: string
  active: boolean
}

const proxiesStore = useProxiesStore()

// Fetch proxies when the component mounts.
onMounted(() => {
  proxiesStore.fetchProxies()
})

// Create a reactive data source.
const data = computed<ProxyItem[]>(() => proxiesStore.proxies)

// Helper functions for actions.
const toggleProxy = async (id: number) => {
  await proxiesStore.toggleProxy(id)
}

const deleteProxy = async (id: number) => {
  await proxiesStore.deleteProxy(id)
}

// Define the table columns.
const columns = ref<ColumnDef<ProxyItem, any>[]>([
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'ip',
    header: 'IP',
  },
  {
    accessorKey: 'port',
    header: 'Port',
  },
  {
    accessorKey: 'username',
    header: 'Username',
  },
  {
    accessorKey: 'password',
    header: 'Password',
  },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  },
  {
    id: 'actions',
    header: 'Actions',
    // Render the ProxyActionsCell using the Vue h() helper.
    cell: ({ row }) => {
      return h(ProxyActionsCell, {
        proxy: row.original,
        onToggle: toggleProxy,
        onDelete: deleteProxy,
      })
    },
  },
])

// Create the TanStack Table instance with the missing properties supplied.
const table = createTable<ProxyItem>({
  data: data.value,
  columns: columns.value,
  getCoreRowModel: getCoreRowModel(),
  // Provide the missing properties as defaults.
  state: {},
  onStateChange: () => {},
  renderFallbackValue: () => null,
})

// Update table data when store data changes.
watchEffect(() => {
  table.setOptions((prev) => ({ ...prev, data: data.value }))
})
</script>

<template>
  <div class="p-4">
    <div class="rounded-lg shadow-sm">
      <table class="min-w-full divide-y divide-primary !rounded-lg">
        <thead class="bg-secondary rounded-lg overflow-hidden p-1">
          <tr>
            <th
              v-for="column in table.getAllLeafColumns()"
              :key="column.id"
              class="px-6 py-3 text-left text-xs font-medium text-primary-foreground uppercase tracking-wider"
            >
              {{ column.columnDef.header }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-popover divide-y divide-gray-200">
          <tr v-for="row in table.getRowModel().rows" :key="row.id">
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >
              <!-- For the actions column, cell.getValue() now returns a VNode -->
              <template v-if="cell.column.id === 'actions'">
                <component :is="cell.getValue()" />
              </template>
              <template v-else>
                {{ cell.getValue() }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped></style>
