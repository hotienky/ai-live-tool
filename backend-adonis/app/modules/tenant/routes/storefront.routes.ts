import router from '@adonisjs/core/services/router'

const StorefrontController = () => import('#controllers/storefront_controller')

/**
 * Storefront Public API — No auth, tenant-scoped via middleware
 */
export function registerStorefrontRoutes() {
  // New tenant-scoped endpoint
  router.group(() => {
    router.get('/products', [StorefrontController, 'products'])
    router.get('/products/:id', [StorefrontController, 'productDetail'])
    router.get('/categories', [StorefrontController, 'categories'])
    router.get('/brands', [StorefrontController, 'brands'])
    router.get('/banners', [StorefrontController, 'banners'])
    router.get('/pages', [StorefrontController, 'pages'])
    router.get('/pages/:id', [StorefrontController, 'pageDetail'])
    router.get('/info', [StorefrontController, 'storeInfo'])
  }).prefix('/api/storefront')

  // Legacy backward-compat
  router.group(() => {
    router.get('/products', [StorefrontController, 'products']).as('legacy.storefront.products')
    router.get('/products/:id', [StorefrontController, 'productDetail']).as('legacy.storefront.productDetail')
    router.get('/categories', [StorefrontController, 'categories']).as('legacy.storefront.categories')
    router.get('/brands', [StorefrontController, 'brands']).as('legacy.storefront.brands')
    router.get('/banners', [StorefrontController, 'banners']).as('legacy.storefront.banners')
    router.get('/pages', [StorefrontController, 'pages']).as('legacy.storefront.pages')
    router.get('/pages/:id', [StorefrontController, 'pageDetail']).as('legacy.storefront.pageDetail')
    router.get('/info', [StorefrontController, 'storeInfo']).as('legacy.storefront.storeInfo')
  }).prefix('/api/shop/store/:storeId')
}
