import router from '@adonisjs/core/services/router'

const ShopAuthController = () => import('#controllers/shop_auth_controller')

/**
 * Shop Customer Auth — Register/login for shop customers, tenant-scoped
 */
export function registerShopAuthRoutes() {
  router.group(() => {
    router.post('/register', [ShopAuthController, 'register'])
    router.post('/login', [ShopAuthController, 'login'])
    router.get('/me', [ShopAuthController, 'me'])
    router.put('/profile', [ShopAuthController, 'updateProfile'])
    router.put('/password', [ShopAuthController, 'changePassword'])
    router.post('/forgot-password', [ShopAuthController, 'forgotPassword'])
    router.post('/reset-password', [ShopAuthController, 'resetPassword'])
  }).prefix('/api/shop/auth')
}
