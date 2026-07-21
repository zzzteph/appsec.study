import { createRouter, createWebHistory } from 'vue-router'
import { token } from './api'

// Every view is a lazy chunk; the staff console is a separate code-split bundle
// that is only fetched when you navigate to /staff.
const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Lobby.vue') },
  { path: '/game/:slug', component: () => import('./views/GameView.vue') },
  { path: '/cashier', component: () => import('./views/Cashier.vue') },
  { path: '/promotions', component: () => import('./views/Promotions.vue') },
  { path: '/social', component: () => import('./views/Social.vue') },
  { path: '/vip', component: () => import('./views/Vip.vue') },
  { path: '/inbox', component: () => import('./views/Inbox.vue') },
  { path: '/profile', component: () => import('./views/Profile.vue') },
  { path: '/staff', component: () => import('./views/staff/StaffConsole.vue'), meta: { staff: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  if (!to.meta.guest && !token()) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && token()) return { path: '/' }
  return true
})

export default router
