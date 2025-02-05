import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import ScraperView from '@/views/ScraperView.vue'
import AccountsView from '@/views/AccountsView.vue'
import BookedTicketsView from '@/views/BookedTicketsView.vue'
import ProxiesView from '@/views/ProxiesView.vue'
import OwnedTickets from '@/views/OwnedTickets.vue'
import { useUser } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/login',
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: '/login',
      component: LoginView,
      name: 'login',
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: '/dashboard',
      component: DashboardLayout,
      name: 'dashboard',
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/scraper',
      name: 'scraper',
      component: ScraperView,
      meta: { requiresAuth: true },
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/booked-tickets',
      name: 'booked-tickets',
      component: BookedTicketsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/proxies',
      name: 'proxies',
      component: ProxiesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/owned-tickets',
      name: 'owned-tickets',
      component: OwnedTickets,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const store = useUser()
  store.init()
  if (to.meta.requiresAuth && !store.isLoggedIn) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
