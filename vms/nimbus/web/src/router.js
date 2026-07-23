import { createRouter, createWebHistory } from 'vue-router'
import { token } from './api'
const routes = [
  { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
  { path: '/', component: () => import('./views/Files.vue') },
  { path: '/file/:id', component: () => import('./views/FileView.vue') },
  { path: '/profile', component: () => import('./views/Profile.vue') },
  { path: '/s/:token', component: () => import('./views/Share.vue'), meta: { open: true } },
  { path: '/admin', component: () => import('./views/admin/Admin.vue'), meta: { admin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach((to) => {
  if (!to.meta.guest && !to.meta.open && !token()) return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guest && token()) return { path: '/' }
  return true
})
export default router
