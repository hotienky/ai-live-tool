import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './views/HomePage.vue'
import AuthPage from './views/AuthPage.vue'
import AccountPage from './views/AccountPage.vue'
import UrlResolverPage from './views/UrlResolverPage.vue'

/**
 * Storefront Routes — Module-Aware Multi-Tenant Mode
 *
 * Routes are split into groups by module. Only routes for installed
 * modules get registered. Core routes (home, auth, account) are always available.
 */

// ── Core routes (always available) ──
const coreRoutes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/auth', name: 'auth', component: AuthPage },
  { path: '/account', name: 'account', component: AccountPage },
  { path: '/_builder/template-preview', name: 'template-preview', component: () => import('./views/TemplatePreviewPage.vue') },
]

// ── E-commerce routes (requires 'ecom' module) ──
const ecomRoutes = [
  { path: '/products', name: 'products', component: () => import('./views/ProductsPage.vue') },
  { path: '/product/:slug', name: 'product-detail', component: () => import('./views/ProductDetailPage.vue'), props: true },
  { path: '/category/:slug', name: 'category', component: () => import('./views/ProductsPage.vue'), props: true },
  { path: '/cart', name: 'cart', component: () => import('./views/CartPage.vue') },
  { path: '/checkout', name: 'checkout', component: () => import('./views/CheckoutPage.vue') },
  { path: '/order-tracking', name: 'order-tracking', component: () => import('./views/OrderTrackingPage.vue') },
  { path: '/search', name: 'search', component: () => import('./views/ProductsPage.vue') },
  { path: '/categories', name: 'categories', component: () => import('./views/CategoriesPage.vue') },
  { path: '/brands', name: 'brands', component: () => import('./views/BrandsPage.vue') },
  { path: '/wishlist', name: 'wishlist', component: () => import('./views/WishlistPage.vue') },
]

// ── Marketing routes (requires 'marketing' module) ──
const marketingRoutes = [
  { path: '/promotions', name: 'promotions', component: () => import('./views/PromotionsPage.vue') },
]

// ── Blog routes (requires 'blog' module) ──
const blogRoutes = [
  { path: '/blog', name: 'blog', component: () => import('./views/BlogPage.vue') },
  { path: '/blog/:slug', name: 'blog-detail', component: () => import('./views/BlogPage.vue'), props: true },
]

// ── CMS routes (requires 'cms' module) ──
const cmsRoutes = [
  { path: '/page/:slug', name: 'cms-page', component: () => import('./views/CmsPage.vue'), props: true },
]

// ── Module → routes mapping ──
const moduleRouteMap = {
  ecom: ecomRoutes,
  marketing: marketingRoutes,
  blog: blogRoutes,
  cms: cmsRoutes,
}

/**
 * Build routes based on installed modules.
 * Call this after fetching site-config to know which modules are active.
 */
export function buildModuleRoutes(installedModules = []) {
  const routes = [...coreRoutes]

  for (const [moduleId, moduleRoutes] of Object.entries(moduleRouteMap)) {
    if (installedModules.includes(moduleId)) {
      routes.push(...moduleRoutes)
    }
  }

  // Catch-all URL Resolver (WordPress / Shopify-like logic) — always last
  routes.push({ path: '/:slug(.*)*', name: 'url-resolver', component: UrlResolverPage })

  return routes
}

/**
 * Create router with ALL routes initially (for SSR/prerender compatibility).
 * Dynamic route gating is done via navigation guard after modules are loaded.
 */
const allRoutes = [
  ...coreRoutes,
  ...ecomRoutes,
  ...marketingRoutes,
  ...blogRoutes,
  ...cmsRoutes,
  { path: '/:slug(.*)*', name: 'url-resolver', component: UrlResolverPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes: allRoutes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// ── Navigation guard: redirect to home if route belongs to uninstalled module ──
// Map route names to required module
const routeModuleRequirements = {
  'products': 'ecom', 'product-detail': 'ecom', 'category': 'ecom',
  'cart': 'ecom', 'checkout': 'ecom', 'order-tracking': 'ecom',
  'search': 'ecom', 'categories': 'ecom', 'brands': 'ecom', 'wishlist': 'ecom',
  'promotions': 'marketing',
  'blog': 'blog', 'blog-detail': 'blog',
  'cms-page': 'cms',
}

let _installedModules = null
let _enabledPages = null
let _activeTemplate = 'full_store'

/**
 * Call this from App.vue after loading site-config to enable module gating.
 */
export function setInstalledModules(modules) {
  _installedModules = modules
}

/**
 * Call this from App.vue after loading site-config to enable page toggle gating.
 */
export function setEnabledPages(pages) {
  _enabledPages = pages
}

/**
 * Call this from App.vue to set the active template for route blocking.
 * Templates: full_store | catalog | minimal | landing
 */
export function setActiveTemplate(template) {
  _activeTemplate = template || 'full_store'
}

// Map route names → page toggle key
const routePageRequirements = {
  'products': 'products', 'product-detail': 'products',
  'category': 'products', 'search': 'products',
  'categories': 'products', 'brands': 'products',
  'cart': 'cart', 'checkout': 'cart',
  'account': 'account', 'wishlist': 'account',
  'auth': 'auth',
  'order-tracking': 'order_tracking',
}

// Template → blocked route groups
// landing: no ecom, no marketing (only CMS + blog + core)
// catalog/minimal: no blog (ecom-focused)
const templateBlockedRoutes = {
  landing: ['products', 'product-detail', 'category', 'cart', 'checkout',
            'order-tracking', 'search', 'categories', 'brands', 'wishlist', 'promotions'],
  catalog: ['blog', 'blog-detail'],
  minimal: ['blog', 'blog-detail', 'promotions'],
}

router.beforeEach((to) => {
  // Skip guard until modules are loaded
  if (_installedModules === null) return true

  // 1. Module guard
  const requiredModule = routeModuleRequirements[to.name]
  if (requiredModule && !_installedModules.includes(requiredModule)) {
    return { name: 'home' }
  }

  // 2. Template guard — template type blocks entire route groups
  const blocked = templateBlockedRoutes[_activeTemplate]
  if (blocked && blocked.includes(to.name)) {
    return { name: 'home' }
  }

  // 3. Page toggle guard — admin can disable specific pages
  if (_enabledPages) {
    const requiredPage = routePageRequirements[to.name]
    if (requiredPage && _enabledPages[requiredPage] === false) {
      return { name: 'home' }
    }
  }

  return true
})

export default router
