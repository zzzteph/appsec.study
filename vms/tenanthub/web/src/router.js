import { createRouter, createWebHistory } from 'vue-router'
import { token, currentUser } from './api'

const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Dashboard.vue') },
  { path: '/project/:id', component: () => import('./views/Project.vue') },
  { path: '/ticket/:id', component: () => import('./views/Ticket.vue') },
  { path: '/members', component: () => import('./views/Members.vue') },
  { path: '/admin', component: () => import('./views/admin/Admin.vue'), meta: { admin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (!to.meta.guest && !token()) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && token()) return { path: '/' }
  return true
})
export default router
