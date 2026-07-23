import { createRouter, createWebHistory } from 'vue-router'
import { token } from './api'
const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Chat.vue') },
  { path: '/kb', component: () => import('./views/KB.vue') },
  { path: '/tickets', component: () => import('./views/Tickets.vue') },
  { path: '/account', component: () => import('./views/Account.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (!to.meta.guest && !token()) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && token()) return { path: '/' }
  return true
})
export default router
