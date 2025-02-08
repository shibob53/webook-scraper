<!-- src/views/ProxiesView.vue -->
<script lang="ts" setup>
import { ref, onMounted, watch, h } from 'vue'
import DataTable from '@/components/DataTable.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { useProxiesStore } from '@/stores/proxy'
import ProxyActionCell from '@/components/ProxyActionCell.vue'
import Input from '@/components/ui/input/Input.vue'
import Button from '@/components/ui/button/Button.vue'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

/* --- Define the ProxyItem type --- */
interface ProxyItem {
  id: number
  ip: string
  port: number
  username?: string
  password?: string
  active: boolean
}

/* --- Initialize the Proxies Store --- */
const store = useProxiesStore()

// Fetch proxies when the component mounts.
onMounted(() => {
  store.fetchProxies()
})

/* --- Define helper functions for actions --- */
const toggleProxy = async (id: number) => {
  await store.toggleProxy(id)
}

const deleteProxy = async (id: number) => {
  await store.deleteProxy(id)
}

/* --- Define the Table Columns --- */
const columns = ref<ColumnDef<ProxyItem, any>[]>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'ip', header: 'IP' },
  { accessorKey: 'port', header: 'Port' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'password', header: 'Password' },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      // Render the custom action cell component without using TSX.
      return h(ProxyActionCell, {
        proxy: row.original,
        onToggle: toggleProxy,
        onDelete: deleteProxy,
      })
    },
  },
])

/* --- Create a reactive data source for the table --- */
const data = ref<ProxyItem[]>([])
watch(
  () => store.proxies,
  (proxies) => {
    data.value = [...proxies]
  },
  { deep: true },
)

/* --- Reactive Variables for Create and Bulk Create Dialogs --- */
const createDialogOpen = ref(false)
const bulkDialogOpen = ref(false)

const newProxyForm = ref({
  ip: '',
  port: '',
  username: '',
  password: '',
  active: true,
})

const bulkText = ref('')

/* --- Handler for Creating a Single New Proxy --- */
const handleCreateNew = async () => {
  // Validate required fields.
  if (!newProxyForm.value.ip || !newProxyForm.value.port) {
    // Optionally, show an error message.
    return
  }
  await store.addProxy({
    ip: newProxyForm.value.ip,
    port: Number(newProxyForm.value.port),
    username: newProxyForm.value.username || undefined,
    password: newProxyForm.value.password || undefined,
    active: newProxyForm.value.active,
  })
  // Clear the form.
  newProxyForm.value = { ip: '', port: '', username: '', password: '', active: true }
  createDialogOpen.value = false
}

/* --- Handler for Bulk Importing Proxies --- */
const handleBulkCreate = async () => {
  // Split pasted text by newlines and remove empty lines.
  const lines = bulkText.value.split('\n').filter((line) => line.trim() !== '')
  // Assume each line is in the format: "ip:port" or "ip:port:username:password"
  const proxiesToImport = lines.map((line) => {
    const parts = line.split(':').map((p) => p.trim())
    return {
      ip: parts[0],
      port: Number(parts[1]),
      username: parts.length >= 3 ? parts[2] : undefined,
      password: parts.length >= 4 ? parts[3] : undefined,
      active: true,
    }
  })
  await store.importProxyList(proxiesToImport)
  bulkText.value = ''
  bulkDialogOpen.value = false
}
</script>

<template>
  <DashboardLayout title="Proxies">
    <div
      class="flex justify-between md:items-center flex-col md:flex-row space-y-2 md:space-y-0 mb-4"
    >
      <div class="flex-1">
        <Input class="md:max-w-sm w-full" placeholder="Search" />
      </div>
      <div class="flex gap-2">
        <!-- Create New Proxy Dialog -->
        <Dialog v-model:open="createDialogOpen" modal>
          <DialogTrigger as-child>
            <Button>Create new</Button>
          </DialogTrigger>
          <DialogContent>
            <div class="space-y-4">
              <h4 class="text-lg font-bold">Create New Proxy</h4>
              <div class="grid grid-cols-1 gap-2">
                <Input v-model="newProxyForm.ip" placeholder="IP address" />
                <Input v-model="newProxyForm.port" placeholder="Port" type="number" />
                <Input v-model="newProxyForm.username" placeholder="Username (optional)" />
                <Input
                  v-model="newProxyForm.password"
                  placeholder="Password (optional)"
                  type="password"
                />
              </div>
              <div class="flex justify-end">
                <Button @click="handleCreateNew">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <!-- Bulk Create Proxies Dialog -->
        <Dialog v-model:open="bulkDialogOpen" modal>
          <DialogTrigger as-child>
            <Button variant="ghost">Bulk create</Button>
          </DialogTrigger>
          <DialogContent>
            <div class="space-y-4">
              <h4 class="text-lg font-bold">Bulk Create Proxies</h4>
              <p class="text-sm text-balance">
                Paste your proxies here, one per line. Format: <code>ip:port</code> or
                <code>ip:port:username:password</code>
              </p>
              <Textarea v-model="bulkText" placeholder="Paste proxies here" class="w-full h-32" />
              <div class="flex justify-end">
                <Button variant="outline" @click="handleBulkCreate">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <!-- DataTable to display proxies -->
    <DataTable :columns="columns" :data="data" />
  </DashboardLayout>
</template>

<style scoped>
/* Add any additional custom styles as needed */
</style>
