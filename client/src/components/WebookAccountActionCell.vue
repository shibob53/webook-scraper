<script setup lang="ts">
import { defineProps } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface WebookAccountItem {
  id: number
  email: string
  disabled: boolean
}

interface Props {
  account: WebookAccountItem
  onToggle: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex items-center space-x-2">
    <Button variant="outline" size="sm" @click="() => onToggle(account.id)"> Toggle </Button>
    <Dialog>
      <DialogTrigger as-child>
        <Button variant="destructive" size="sm"> Delete </Button>
      </DialogTrigger>
      <DialogContent>
        <div class="space-y-4">
          <h3 class="text-lg font-bold">Confirm Deletion</h3>
          <p>Are you sure you want to delete account {{ account.email }}?</p>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" size="sm">Cancel</Button>
            <Button variant="destructive" size="sm" @click="() => onDelete(account.id)">
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
