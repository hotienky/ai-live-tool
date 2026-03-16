import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './views/HomePage.vue'
import ProductsPage from './views/ProductsPage.vue'
import ProductDetailPage from './views/ProductDetailPage.vue'
import CmsPage from './views/CmsPage.vue'
import CartPage from './views/CartPage.vue'
import CheckoutPage from './views/CheckoutPage.vue'
import AuthPage from './views/AuthPage.vue'
import AccountPage from './views/AccountPage.vue'
import OrderTrackingPage from './views/OrderTrackingPage.vue'
import CategoriesPage from './views/CategoriesPage.vue'
import BrandsPage from './views/BrandsPage.vue'
import PromotionsPage from './views/PromotionsPage.vue'

/**
 * Storefront Routes — Multi-Tenant Mode
 * No /:storeId prefix needed. Tenant is resolved by subdomain.
 */
const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/products', name: 'products', component: ProductsPage },
  { path: '/product/:slug', name: 'product-detail', component: ProductDetailPage, props: true },
  { path: '/category/:slug', name: 'category', component: ProductsPage, props: true },
  { path: '/page/:slug', name: 'cms-page', component: CmsPage, props: true },
  { path: '/cart', name: 'cart', component: CartPage },
  { path: '/checkout', name: 'checkout', component: CheckoutPage },
  { path: '/auth', name: 'auth', component: AuthPage },
  { path: '/account', name: 'account', component: AccountPage },
  { path: '/order-tracking', name: 'order-tracking', component: OrderTrackingPage },
  { path: '/search', name: 'search', component: ProductsPage },
  { path: '/categories', name: 'categories', component: CategoriesPage },
  { path: '/brands', name: 'brands', component: BrandsPage },
  { path: '/promotions', name: 'promotions', component: PromotionsPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router

