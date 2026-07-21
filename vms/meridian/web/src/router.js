import { createRouter, createWebHistory } from 'vue-router'
import { currentUser } from './api'

const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Dashboard.vue') },
  { path: '/authorize', component: () => import('./views/Authorize.vue') },
  { path: '/apps/docs', component: () => import('./views/apps/Docs.vue'), meta: { open: true } },
  { path: '/apps/shop', component: () => import('./views/apps/Shop.vue'), meta: { open: true } },
  { path: '/apps/catcher', component: () => import('./views/apps/Catcher.vue'), meta: { open: true } },
  { path: '/admin', component: () => import('./views/admin/Admin.vue') },   // code-split admin chunk
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (!to.meta.guest && !to.meta.open && !currentUser()) return { path: '/login', query: { next: to.fullPath } }
  return true
})
export default router
