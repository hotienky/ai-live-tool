import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './views/HomePage.vue'
import ProductsPage from './views/ProductsPage.vue'
import ProductDetailPage from './views/ProductDetailPage.vue'
import CmsPage from './views/CmsPage.vue'

const routes = [
  { path: '/:storeId', name: 'home', component: HomePage, props: true },
  { path: '/:storeId/products', name: 'products', component: ProductsPage, props: true },
  { path: '/:storeId/product/:productId', name: 'product-detail', component: ProductDetailPage, props: true },
  { path: '/:storeId/category/:categoryId', name: 'category', component: ProductsPage, props: true },
  { path: '/:storeId/page/:pageId', name: 'cms-page', component: CmsPage, props: true },
  { path: '/', redirect: '/1' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
