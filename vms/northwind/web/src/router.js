import { createRouter, createWebHistory } from 'vue-router'
import { token } from './api'

const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Dashboard.vue') },
  { path: '/transfer', component: () => import('./views/Transfer.vue') },
  { path: '/statements', component: () => import('./views/Statements.vue') },
  { path: '/inbox', component: () => import('./views/Inbox.vue') },
  { path: '/support', component: () => import('./views/Support.vue') },
  { path: '/profile', component: () => import('./views/Profile.vue') },
  { path: '/staff', component: () => import('./views/staff/BackOffice.vue'), meta: { staff: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (!to.meta.guest && !token()) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && token()) return { path: '/' }
  return true
})
export default router
