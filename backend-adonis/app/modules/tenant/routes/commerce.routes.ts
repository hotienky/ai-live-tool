import router from '@adonisjs/core/services/router'

const OrdersController = () => import('#controllers/orders_controller')
const CartsController = () => import('#controllers/carts_controller')
const PromotionsController = () => import('#controllers/promotions_controller')
const ShopCustomersController = () => import('#controllers/shop_customers_controller')

/**
 * Commerce routes — Orders, Cart, Promotions, Coupons, Shop Customers
 */
export function registerCommerceRoutes(group: ReturnType<typeof router.group>) {
  // Orders
  group.get('/orders', [OrdersController, 'index'])
  group.get('/orders/stats', [OrdersController, 'stats'])
  group.post('/orders', [OrdersController, 'store'])
  group.get('/orders/:id', [OrdersController, 'show'])
  group.put('/orders/:id', [OrdersController, 'update'])
  group.delete('/orders/:id', [OrdersController, 'destroy'])
  group.get('/orders/:id/details', [OrdersController, 'getDetails'])
  group.get('/orders/:id/totals', [OrdersController, 'getTotals'])
  group.get('/orders/:id/history', [OrdersController, 'getHistory'])
  group.put('/orders/:id/status', [OrdersController, 'updateStatus'])
  group.get('/order-statuses', [OrdersController, 'getOrderStatuses'])
  group.get('/payment-statuses', [OrdersController, 'getPaymentStatuses'])

  // Cart
  group.get('/cart', [CartsController, 'show'])
  group.post('/cart/items', [CartsController, 'addItem'])
  group.put('/cart/items/:productId', [CartsController, 'updateItem'])
  group.delete('/cart/items/:productId', [CartsController, 'removeItem'])
  group.post('/cart/checkout', [CartsController, 'checkout'])

  // Wishlist & Compare
  group.get('/wishlist', [CartsController, 'showWishlist'])
  group.post('/wishlist', [CartsController, 'addToWishlist'])
  group.delete('/wishlist/:productId', [CartsController, 'removeFromWishlist'])
  group.get('/compare', [CartsController, 'showCompare'])
  group.post('/compare', [CartsController, 'addToCompare'])
  group.delete('/compare/:productId', [CartsController, 'removeFromCompare'])

  // Promotions
  group.get('/promotions', [PromotionsController, 'index'])
  group.post('/promotions', [PromotionsController, 'store'])
  group.put('/promotions/:id', [PromotionsController, 'update'])
  group.delete('/promotions/:id', [PromotionsController, 'destroy'])

  // Shop Customers
  group.get('/shop-customers', [ShopCustomersController, 'index'])
  group.post('/shop-customers', [ShopCustomersController, 'store'])
  group.get('/shop-customers/:id', [ShopCustomersController, 'show'])
  group.put('/shop-customers/:id', [ShopCustomersController, 'update'])
  group.delete('/shop-customers/:id', [ShopCustomersController, 'destroy'])
  group.get('/shop-customers/:customerId/addresses', [ShopCustomersController, 'listAddresses'])
  group.post('/shop-customers/:customerId/addresses', [ShopCustomersController, 'addAddress'])
  group.put('/shop-customers/:customerId/addresses/:id', [ShopCustomersController, 'updateAddress'])
  group.delete('/shop-customers/:customerId/addresses/:id', [ShopCustomersController, 'deleteAddress'])
}
