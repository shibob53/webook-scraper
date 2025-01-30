import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ScraperView from '@/views/ScraperView.vue'
import AccountsView from '@/views/AccountsView.vue'
import BookedTicketsView from '@/views/BookedTicketsView.vue'
import ProxiesView from '@/views/ProxiesView.vue'
import EventQueueView from '@/views/EventQueueView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/login',
    },
    {
      path: '/login',
      component: LoginView,
      name: 'login',
    },
    {
      path: '/dashboard',
      component: DashboardLayout,
      name: 'dashboard',
    },
    {
      path: '/scraper',
      name: 'scraper',
      component: ScraperView,
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsView,
    },
    {
      path: '/booked-tickets',
      name: 'booked-tickets',
      component: BookedTicketsView,
    },
    {
      path: '/proxies',
      name: 'proxies',
      component: ProxiesView,
    },
    {
      path: '/event-queue',
      name: 'event-queue',
      component: EventQueueView,
    },
  ],
})

export default router
