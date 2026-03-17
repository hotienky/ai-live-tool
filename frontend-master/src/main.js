import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// ──── Routes ────
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('./layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('./pages/DashboardPage.vue') },
      { path: 'tenants', name: 'Tenants', component: () => import('./pages/TenantsPage.vue') },
      { path: 'tenants/new', name: 'CreateTenant', component: () => import('./pages/CreateTenantPage.vue') },
      { path: 'tenants/:id', name: 'TenantDetail', component: () => import('./pages/TenantDetailPage.vue') },
      { path: 'users', name: 'Users', component: () => import('./pages/UsersPage.vue') },
      { path: 'roles', name: 'Roles', component: () => import('./pages/RolesPage.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ──── Auth Guard ────
router.beforeEach((to) => {
  const token = localStorage.getItem('master_token')
  if (!to.meta.public && !token) {
    return { name: 'Login' }
  }
})

// ──── Mount ────
const app = createApp(App)
app.use(router)
app.mount('#app')
