import { createRouter, createWebHistory } from 'vue-router'
import { token } from './api'
const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Dashboards.vue') },
  { path: '/explore', component: () => import('./views/Explore.vue') },
  { path: '/reports', component: () => import('./views/Reports.vue') },
  { path: '/profile', component: () => import('./views/Profile.vue') },
  { path: '/admin', component: () => import('./views/admin/Admin.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => { if (!to.meta.guest && !token()) return { path: '/login', query: { next: to.fullPath } }; if (to.meta.guest && token()) return { path: '/' }; return true })
export default router
