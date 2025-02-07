<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useUser } from './stores/user'
import { onMounted } from 'vue'
import { useSocket } from './stores/socket'

const userStore = useUser()
const socket = useSocket()

onMounted(() => {
  socket.connect()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <RouterView />
  </div>
</template>

<style scoped></style>
