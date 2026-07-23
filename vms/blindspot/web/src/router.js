import { createRouter, createWebHistory } from 'vue-router'
import { token } from './api'
const routes = [
  { path: '/', component: () => import('./views/Track.vue'), meta: { open: true } },
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/account', component: () => import('./views/Account.vue') },
  { path: '/admin', component: () => import('./views/admin/Admin.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (!to.meta.guest && !to.meta.open && !token()) return { path: '/login', query: { next: to.fullPath } }
  return true
})
export default router
