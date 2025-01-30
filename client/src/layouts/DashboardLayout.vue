<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Bell,
  CircleUser,
  EarthLock,
  Home,
  LineChart,
  Menu,
  MonitorDot,
  Package,
  Package2,
  Rows3,
  Search,
  ShoppingCart,
  Tickets,
  UserCog,
  Users,
} from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const props = defineProps<{
  title: string
}>()

const route = useRoute()
</script>

<template>
  <div class="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
    <div class="hidden border-r bg-muted/40 md:block">
      <div class="flex h-full max-h-screen flex-col gap-2">
        <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <a href="/" class="flex items-center gap-2 font-semibold">
            <Package2 class="h-6 w-6" />
            <span class="">Webook scraper</span>
          </a>
        </div>
        <div class="flex-1">
          <nav class="grid items-start px-2 text-sm font-medium lg:px-4">
            <RouterLink
              to="/scraper"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              :class="{ 'text-primary bg-muted': route.path === '/scraper' }"
            >
              <MonitorDot class="h-4 w-4" />
              Scraper
            </RouterLink>
            <RouterLink
              to="/accounts"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              :class="{ 'text-primary bg-muted': route.path === '/accounts' }"
            >
              <UserCog class="h-4 w-4" />
              Accounts
              <Badge class="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                0
              </Badge>
            </RouterLink>
            <RouterLink
              to="/booked-tickets"
              class="flex items-center gap-3 rounded-lg text-muted-foreground px-3 py-2 transition-all hover:text-primary"
              :class="{ 'text-primary bg-muted': route.path === '/booked-tickets' }"
            >
              <Tickets class="h-4 w-4" />
              Booked tickets
            </RouterLink>
            <RouterLink
              to="/proxies"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              :class="{ 'text-primary bg-muted': route.path === '/proxies' }"
            >
              <EarthLock class="h-4 w-4" />
              Proxies
            </RouterLink>
            <RouterLink
              to="/event-queue"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              :class="{ 'text-primary bg-muted': route.path === '/event-queue' }"
            >
              <Rows3 class="h-4 w-4" />
              Event Queue
            </RouterLink>
          </nav>
        </div>
      </div>
    </div>
    <div class="flex flex-col">
      <header class="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <Sheet>
          <SheetTrigger as-child>
            <Button variant="outline" size="icon" class="shrink-0 md:hidden">
              <Menu class="h-5 w-5" />
              <span class="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="flex flex-col">
            <nav class="grid gap-2 text-lg font-medium">
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <MonitorDot class="h-4 w-4" />
                Scraper
              </a>
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <UserCog class="h-4 w-4" />
                Accounts
                <Badge
                  class="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                >
                  6
                </Badge>
              </a>
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
              >
                <Tickets class="h-4 w-4" />
                Booked tickets
              </a>
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <EarthLock class="h-4 w-4" />
                Proxies
              </a>
              <a
                href="#"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Rows3 class="h-4 w-4" />
                Events Queue
              </a>
            </nav>
          </SheetContent>
        </Sheet>
        <div class="w-full flex-1"></div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon" class="rounded-full">
              <CircleUser class="h-5 w-5" />
              <span class="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div class="flex items-center">
          <h1 class="text-lg font-semibold md:text-2xl">{{ title }}</h1>
        </div>
        <slot />
      </main>
    </div>
  </div>
</template>
