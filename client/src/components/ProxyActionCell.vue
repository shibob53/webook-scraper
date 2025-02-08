<!-- src/components/ProxyActionsCell.vue -->
<script setup lang="ts">
import { defineProps } from 'vue'
import { Button } from '@/components/ui/button' // adjust the path to your shadcn-vue Button
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog' // adjust as needed

interface ProxyItem {
  id: number
  ip: string
  port: number
  active: boolean
}

interface Props {
  proxy: ProxyItem
  onToggle: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex items-center space-x-2">
    <!-- Toggle Button -->
    <Button variant="outline" size="sm" @click="() => onToggle(proxy.id)"> Toggle </Button>

    <!-- Delete Action wrapped in a Dialog for confirmation -->
    <Dialog>
      <DialogTrigger as-child>
        <Button variant="destructive" size="sm"> Delete </Button>
      </DialogTrigger>
      <DialogContent>
        <div class="space-y-4">
          <h3 class="text-lg font-bold">Confirm Deletion</h3>
          <p>Are you sure you want to delete proxy {{ proxy.ip }}:{{ proxy.port }}?</p>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" size="sm"> Cancel </Button>
            <Button variant="destructive" size="sm" @click="() => onDelete(proxy.id)">
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
