import { createRouter, createWebHistory } from 'vue-router'
import { token } from './api'
const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/rooms/:id', component: () => import('./views/Room.vue') },
  { path: '/account', component: () => import('./views/Account.vue'), meta: { auth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (to.meta.auth && !token()) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && token()) return { path: '/' }
  return true
})
export default router
