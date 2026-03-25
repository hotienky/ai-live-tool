/**
 * CMS Admin Router (Bridge Mode)
 * 
 * Integrates Vue Router with the existing activeView-based navigation.
 * Instead of replacing v-if/v-else with <router-view>, this router
 * acts as a bridge: it manages URL state while App.vue continues
 * to use its existing view switching mechanism.
 * 
 * Benefits:
 * - Browser back/forward works properly
 * - Direct URL navigation works
 * - Plugin hooks system (ADMIN_ROUTES) is preserved
 * - No breaking changes to child components
 * 
 * Usage in App.vue:
 *   const router = useRouter()
 *   const route = useRoute()
 *   // navigateTo() now calls router.push() instead of history.pushState()
 *   // activeView syncs from route.path
 */
import { createRouter, createWebHistory } from 'vue-router'

// Single "App Shell" component — App.vue handles all view rendering
// via its existing v-if system. The route just carries the URL state.
const AppShell = { render: () => null }

const routes = [
  // Catch-all: every path maps to the AppShell
  // App.vue reads the current route path to set activeView
  {
    path: '/:pathMatch(.*)*',
    name: 'app',
    component: AppShell,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
