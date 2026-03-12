import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './views/HomePage.vue'
import ProductsPage from './views/ProductsPage.vue'
import ProductDetailPage from './views/ProductDetailPage.vue'
import CmsPage from './views/CmsPage.vue'
import CartPage from './views/CartPage.vue'
import CheckoutPage from './views/CheckoutPage.vue'

/**
 * Storefront Routes — Multi-Tenant Mode
 * No /:storeId prefix needed. Tenant is resolved by subdomain.
 */
const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/products', name: 'products', component: ProductsPage },
  { path: '/product/:productId', name: 'product-detail', component: ProductDetailPage, props: true },
  { path: '/category/:categoryId', name: 'category', component: ProductsPage, props: true },
  { path: '/page/:pageId', name: 'cms-page', component: CmsPage, props: true },
  { path: '/cart', name: 'cart', component: CartPage },
  { path: '/checkout', name: 'checkout', component: CheckoutPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
