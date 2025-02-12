<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import DataTable from '@/components/DataTable.vue'
import Input from '@/components/ui/input/Input.vue'
import Button from '@/components/ui/button/Button.vue'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { useWebookAccountStore } from '@/stores/webookAccount'
import WebookAccountActionCell from '@/components/WebookAccountActionCell.vue'

interface WebookAccountItem {
  id: number
  email: string
  password: string
  jwt?: string
  jwtExpiresIn?: number
  cookiesJson?: string
  disabled: boolean
  apiToken: string
}

const store = useWebookAccountStore()

onMounted(() => {
  store.fetchAccounts()
})

const data = ref<WebookAccountItem[]>([])
watch(
  () => store.accounts,
  (accounts) => {
    data.value = [...accounts]
  },
  { deep: true },
)

// Helper functions for actions.
const toggleAccount = async (id: number) => {
  await store.toggleAccount(id)
}

const deleteAccount = async (id: number) => {
  await store.deleteAccount(id)
}

// Define table columns.
const columns = ref<ColumnDef<WebookAccountItem, any>[]>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'disabled',
    header: 'Disabled',
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  },
  { accessorKey: 'apiToken', header: 'API Token' },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) =>
      h(WebookAccountActionCell, {
        account: row.original,
        onToggle: toggleAccount,
        onDelete: deleteAccount,
      }),
  },
])

// Reactive variables for Create and Bulk Create dialogs.
const createDialogOpen = ref(false)
const bulkDialogOpen = ref(false)

const newAccountForm = ref({
  email: '',
  password: '',
  disabled: false,
})

const bulkText = ref('')

const handleCreateNew = async () => {
  if (!newAccountForm.value.email || !newAccountForm.value.password) return
  await store.addAccount({
    email: newAccountForm.value.email,
    password: newAccountForm.value.password,
    disabled: newAccountForm.value.disabled,
    apiToken: 'e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2',
  })
  newAccountForm.value = { email: '', password: '', disabled: false }
  createDialogOpen.value = false
}

const handleBulkCreate = async () => {
  // Assume each line is in the format "email:password"
  const lines = bulkText.value.split('\n').filter((line) => line.trim() !== '')
  const accountsToImport = lines.map((line) => {
    const parts = line.split(':').map((part) => part.trim())
    return {
      email: parts[0],
      password: parts[1],
      disabled: false,
      apiToken: 'e9aac1f2f0b6c07d6be070ed14829de684264278359148d6a582ca65a50934d2',
    }
  })
  await store.importAccounts(accountsToImport)
  bulkText.value = ''
  bulkDialogOpen.value = false
}
</script>

<template>
  <DashboardLayout title="Webook Accounts">
    <div
      class="flex justify-between md:items-center flex-col md:flex-row space-y-2 md:space-y-0 mb-4"
    >
      <div class="flex-1">
        <Input class="md:max-w-sm w-full" placeholder="Search" />
      </div>
      <div class="flex gap-2">
        <Button variant="destructive" @click="store.clear">Clear all</Button>
        <!-- Create New Account Dialog -->
        <Dialog v-model:open="createDialogOpen" modal>
          <DialogTrigger as-child>
            <Button>Create new</Button>
          </DialogTrigger>
          <DialogContent>
            <div class="space-y-4">
              <h4 class="text-lg font-bold">Create New Account</h4>
              <div class="grid grid-cols-1 gap-2">
                <Input v-model="newAccountForm.email" placeholder="Email" />
                <Input v-model="newAccountForm.password" placeholder="Password" type="password" />
              </div>
              <div class="flex justify-end">
                <Button @click="handleCreateNew">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <!-- Bulk Create Accounts Dialog -->
        <Dialog v-model:open="bulkDialogOpen" modal>
          <DialogTrigger as-child>
            <Button variant="ghost">Bulk create</Button>
          </DialogTrigger>
          <DialogContent>
            <div class="space-y-4">
              <h4 class="text-lg font-bold">Bulk Create Accounts</h4>
              <p class="text-sm text-gray-600">
                Paste your accounts here, one per line in the format:
                <code>email:password</code>
              </p>
              <Textarea v-model="bulkText" placeholder="Paste accounts here" class="w-full h-32" />
              <div class="flex justify-end">
                <Button variant="outline" @click="handleBulkCreate"> Create </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <DataTable :columns="columns" :data="data" />
  </DashboardLayout>
</template>

<style scoped>
/* Add any additional custom styles as needed */
</style>
