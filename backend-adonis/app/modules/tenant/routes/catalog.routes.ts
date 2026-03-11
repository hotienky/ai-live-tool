import router from '@adonisjs/core/services/router'

const ProductsController = () => import('#controllers/products_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const BrandsController = () => import('#controllers/brands_controller')

/**
 * Catalog routes — Products, Categories, Brands (admin CRUD)
 */
export function registerCatalogRoutes(group: ReturnType<typeof router.group>) {
  // Products
  group.get('/products', [ProductsController, 'index'])
  group.post('/products', [ProductsController, 'store'])
  group.put('/products/:id', [ProductsController, 'update'])
  group.delete('/products/:id', [ProductsController, 'destroy'])
  group.post('/products/:id/adjust-stock', [ProductsController, 'adjustStock'])

  // Categories
  group.get('/categories', [CategoriesController, 'index'])
  group.post('/categories', [CategoriesController, 'store'])
  group.put('/categories/:id', [CategoriesController, 'update'])
  group.delete('/categories/:id', [CategoriesController, 'destroy'])

  // Brands
  group.get('/brands', [BrandsController, 'index'])
  group.post('/brands', [BrandsController, 'store'])
  group.put('/brands/:id', [BrandsController, 'update'])
  group.delete('/brands/:id', [BrandsController, 'destroy'])
}
