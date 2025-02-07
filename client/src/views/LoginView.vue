<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/stores/user'
import { Loader } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const store = useUser()
const username = ref('')
const password = ref('')
const router = useRouter()

const login = async () => {
  await store.login(username.value, password.value)
  router.push('/scraper')
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-2xl"> Login </CardTitle>
      <CardDescription> Enter your username below to login to your account. </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4">
      <div class="grid gap-2">
        <Label for="username">Usermane</Label>
        <Input v-model="username" id="username" type="text" placeholder="username" required />
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input v-model="password" id="password" type="password" required />
      </div>
    </CardContent>
    <CardFooter>
      <Button @click="login" class="w-full" :disabled="store.isLoggingIn">
        <Loader class="animate-spin" v-if="store.isLoggingIn" /> Sign in
      </Button>
    </CardFooter>
  </Card>
</template>
