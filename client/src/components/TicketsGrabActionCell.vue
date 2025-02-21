<script lang="ts" setup>
import { EllipsisVertical } from 'lucide-vue-next';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from './ui/dropdown-menu';
import { useTicketGrabsStore } from '@/stores/grab';

const props = defineProps({
    row: Object
})

const store = useTicketGrabsStore()

const move = () => {
    store.moveToOwned(props.row?.id)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline"> <EllipsisVertical /> </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56">
      <DropdownMenuItem @click="move">Move to owned</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style></style>
