# Phase 2: Tách E-commerce ra Plugin 📦

> **Priority**: 🔴 Critical — Core phải agnostic  
> **Duration**: 2–3 weeks  
> **Depends on**: Phase 1 (Hooks System)  
> **Blocks**: Phase 6 (Themes)

---

## Mục tiêu

Di chuyển tất cả e-commerce components từ `frontend/src/components/` sang `plugins/ecom/`, biến core thành CMS thuần. Tenant không cài module `ecom` sẽ KHÔNG thấy bất kỳ UI e-commerce nào.

---

## Current State — Components cần di chuyển

### Từ `frontend/src/components/` → `plugins/ecom/`

| File | Size | Component | Ghi chú |
|------|------|-----------|---------|
| `ProductManager.vue` | 1.8KB | Product router | Wrapper component |
| `ProductForm.vue` | 26KB | Product editor | Variants, images, SEO |
| `ProductList.vue` | 13KB | Product listing | Grid, filters |
| `OrderManagement.vue` | 42KB | Order list + management | Lớn nhất |
| `OrderDetailPage.vue` | 24KB | Order detail view | |
| `CustomerManager.vue` | 5KB | Customer router | |
| `CustomerForm.vue` | 12KB | Customer editor | |
| `CustomerDetail.vue` | 16KB | Customer detail modal | |
| `PromotionForm.vue` | 14KB | Promotion editor | |
| `PromotionManager.vue` | 7KB | Promotion listing | |
| `FlashSaleManager.vue` | 17KB | Flash sale listing | |
| `FlashSaleForm.vue` | 23KB | Flash sale editor | |
| `CurrencyInput.vue` | 2.7KB | Currency input helper | Shared → keep in core |
| `InventoryManagement.vue` | 34KB | Inventory grid | Move to warehouse plugin |
| `PricingSuggestion.vue` | 9KB | AI pricing | |
| `InvoicePreviewModal.vue` | 15KB | Invoice preview | |

### Từ backend controllers

| File | Cần xử lý |
|------|-----------|
| `ProductsController.php` | Conditional route loading |
| `OrdersController.php` | Conditional route loading |
| `CustomersController.php` | Conditional route loading |
| `CartController.php` | Conditional route loading |
| `WishlistController.php` | Conditional route loading |
| `CouponsController.php` | Conditional route loading |
| `FlashSalesController.php` | Conditional route loading |
| `PromotionsController.php` | Already handled by marketing plugin |
| `InvoiceController.php` | Conditional route loading |
| `ExportController.php` | Check module dependency |

---

## Detailed Tasks

### 2.1 Create `plugins/ecom/` Plugin Scaffold

```
plugins/ecom/
  ├── src/
  │   ├── components/
  │   │   ├── ProductManager.vue
  │   │   ├── ProductForm.vue
  │   │   ├── ProductList.vue
  │   │   ├── OrderManagement.vue
  │   │   ├── OrderDetailPage.vue
  │   │   ├── CustomerManager.vue
  │   │   ├── CustomerForm.vue
  │   │   ├── CustomerDetail.vue
  │   │   ├── PricingSuggestion.vue
  │   │   └── InvoicePreviewModal.vue
  │   ├── helpers.js
  │   └── index.js         ← register with hooks
  ├── vite.config.js
  └── package.json
```

**Checklist:**
- [ ] Create folder structure
- [ ] Copy `vite.config.js` from existing plugin (e.g. `plugins/accounting/`)
- [ ] Create `package.json` with dependencies
- [ ] Move Vue components from frontend
- [ ] Adjust import paths within moved components
- [ ] Create `index.js` with plugin registration + hooks

### 2.2 Plugin `index.js` — Register via Hooks

```javascript
// plugins/ecom/src/index.js
import ProductManager from './components/ProductManager.vue'
import ProductForm from './components/ProductForm.vue'
import OrderManagement from './components/OrderManagement.vue'
import OrderDetailPage from './components/OrderDetailPage.vue'
import CustomerManager from './components/CustomerManager.vue'
// ... etc

const { hooks, t } = window.__APP_BRIDGE__

// Register sidebar items
hooks.addFilter('sidebar_items', (items) => {
  items.push(
    {
      key: 'store-group', label: t('admin.store', 'Cửa hàng'), icon: 'Store',
      group: 'store', moduleId: 'ecom',
      children: [
        { key: 'shop/products', view: 'shop/products', label: t('admin.products', 'Sản phẩm'), icon: 'Package' },
        { key: 'shop/categories', view: 'shop/categories', label: t('admin.categories', 'Danh mục'), icon: 'Grid3X3' },
        { key: 'shop/brands', view: 'shop/brands', label: t('admin.brands', 'Thương hiệu'), icon: 'Award' },
        { key: 'orders', view: 'orders', label: t('admin.orders', 'Đơn hàng'), icon: 'ShoppingBag' },
        { key: 'orders/customers', view: 'orders/customers', label: t('admin.customers', 'Khách hàng'), icon: 'Users' },
      ]
    }
  )
  return items
})

// Register routes
hooks.addFilter('admin_routes', (config) => {
  Object.assign(config.routeToTab, {
    'shop/products': 'products',
    'shop/products/edit': 'products',
    'shop/categories': 'categories',
    'shop/categories/edit': 'categories',
    'shop/brands': 'brands',
    'orders': 'orders',
    'orders/customers': 'shop-customers',
    'orders/detail': 'order-detail',
  })
  return config
})

// Register components
window.__PLUGIN_REGISTRY__['ecom'] = {
  components: {
    'products': ProductManager,
    'products-form': ProductForm,
    'orders': OrderManagement,
    'order-detail': OrderDetailPage,
    'customers': CustomerManager,
  }
}
```

**Checklist:**
- [ ] Write `index.js` with all component imports
- [ ] Register sidebar items via hooks
- [ ] Register routes via hooks
- [ ] Register all components in `__PLUGIN_REGISTRY__`

### 2.3 Refactor `App.vue` — Remove Hardcoded E-com

**File**: `frontend/src/App.vue`

Hiện tại `App.vue` (L473–L477) có:
```javascript
{
  key: 'shop/products', label: t('admin.store', 'Cửa hàng'), icon: Store,
  featureGroup: 'store',
  permission: 'products.view',
},
```

**Action**: Xóa entry này. Plugin `ecom` sẽ đăng ký qua hooks.

Hiện tại `App.vue` imports (L334–L339):
```javascript
import ShopSettings from './components/ShopSettings.vue'
import CustomerDetail from './components/CustomerDetail.vue'
```

**Action**: 
- Giữ `ShopSettings.vue` trong core (nó render plugin tabs)
- Move `CustomerDetail.vue` import sang dynamic loading

**routeToTab** (L515–L526): Xóa tất cả e-com routes:
```diff
- 'shop/products': 'products',
- 'shop/products/edit': 'products',
- 'shop/categories': 'categories',
- 'shop/categories/edit': 'categories',
- 'shop/brands': 'brands',
- 'orders': 'orders',
- 'orders/customers': 'shop-customers',
- 'orders/detail': 'order-detail',
```

**Checklist:**
- [ ] Remove e-com navItem from `navItems` array
- [ ] Remove e-com routes from `routeToTab`
- [ ] Remove e-com component imports
- [ ] Verify `ShopSettings.vue` still works (it renders tabs dynamically)
- [ ] Update `ShopSettings.vue` — e-com tabs only show when ecom module installed

### 2.4 Refactor `ShopSettings.vue` — Conditional E-com Tabs

**File**: `frontend/src/components/ShopSettings.vue` (76KB — rất lớn)

Hiện tại file này chứa tab rendering cho tất cả modules. Cần:
- Core tabs (appearance, layout, store-info, config): luôn hiện
- E-com tabs (products, categories, brands, orders): chỉ hiện khi `ecom` installed
- Plugin tabs (accounting, warehouse, etc.): đã dynamic

**Checklist:**
- [ ] Group tabs: core vs module-dependent
- [ ] E-com related tabs wrapped in `v-if="isModuleInstalled('ecom')"`
- [ ] Hoặc tốt hơn: plugins register additional tabs via hooks

### 2.5 Backend — Conditional Route Loading

**File**: `backend-laravel/routes/tenant.php`

Wrap e-com routes trong module check:

```php
// routes/tenant.php

// Core routes (always available)
Route::apiResource('cms-pages', CmsPagesController::class);
Route::apiResource('media', MediaController::class);
Route::apiResource('nav-links', NavLinksController::class);
// ...

// E-commerce routes (only if ecom module installed)
if (ModuleRegistry::isInstalled(tenant('id'), 'ecom')) {
    Route::apiResource('products', ProductsController::class);
    Route::apiResource('orders', OrdersController::class);
    Route::apiResource('customers', CustomersController::class);
    Route::apiResource('cart', CartController::class);
    // ...
}
```

**Hoặc dùng middleware approach** (tốt hơn cho performance):
```php
Route::middleware('module:ecom')->group(function () {
    Route::apiResource('products', ProductsController::class);
    // ...
});
```

**Checklist:**
- [ ] Create `ModuleMiddleware` class
- [ ] Register middleware in kernel
- [ ] Group e-com routes under `module:ecom` middleware
- [ ] Group shipping routes under `module:shipping` middleware
- [ ] Test: tenant without ecom → API returns 404

### 2.6 Module Migration System

Khi install module → chạy migrations của module đó.

**File**: `backend-laravel/app/Services/ModuleRegistry.php`

```php
// Thêm vào method install()
protected static function runModuleMigrations(string $moduleId): void
{
    $migrationPath = database_path("migrations/modules/{$moduleId}");
    if (is_dir($migrationPath)) {
        Artisan::call('migrate', [
            '--path' => "database/migrations/modules/{$moduleId}",
            '--force' => true,
        ]);
    }
}
```

```
backend-laravel/database/migrations/modules/
  ├── ecom/
  │   ├── 001_create_products_table.php
  │   ├── 002_create_orders_table.php
  │   └── 003_create_customers_table.php
  ├── blog/
  │   └── 001_create_posts_table.php
  └── lms/
      └── 001_create_courses_table.php
```

**Checklist:**
- [ ] Create `migrations/modules/ecom/` directory
- [ ] Move existing e-com migrations
- [ ] Update `ModuleRegistry::install()` to run migrations
- [ ] Update `ModuleRegistry::uninstall()` (DON'T rollback, just deactivate)
- [ ] Test: install ecom → tables created

### 2.7 Also Move Shipping Components

**From** `frontend/src/components/`:
- `ShippingManagement.vue` (28KB)
- `ShipmentDetail.vue` (18KB)
- `ShipmentForm.vue` (17KB)
- `ShippingSettings.vue` (12KB)

**To** `plugins/shipping/` (create new plugin)

**Checklist:**
- [ ] Create `plugins/shipping/` scaffold
- [ ] Move 4 shipping components
- [ ] Register via hooks
- [ ] Build plugin

---

## Testing Checklist

- [ ] Fresh tenant (no ecom module) → NO products, orders, customers in sidebar
- [ ] Install ecom module → products, orders, customers appear
- [ ] Navigate to /shop/products → products page renders
- [ ] Create/edit product → works correctly
- [ ] Create order → works correctly
- [ ] Uninstall ecom → sidebar items gone, routes return 404
- [ ] Existing tenants with ecom data → data preserved after migration
- [ ] Build: `npx vite build` passed
- [ ] Build: `cd plugins && node build-all.js` all ✅

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `plugins/ecom/` (entire plugin) |
| **CREATE** | `plugins/shipping/` (entire plugin) |
| **CREATE** | `backend-laravel/app/Http/Middleware/ModuleMiddleware.php` |
| **CREATE** | `backend-laravel/database/migrations/modules/ecom/` |
| **MOVE** | 15+ Vue components from `frontend/src/components/` → `plugins/ecom/` |
| **MOVE** | 4 Vue components → `plugins/shipping/` |
| **MODIFY** | `frontend/src/App.vue` — remove hardcoded e-com |
| **MODIFY** | `frontend/src/components/ShopSettings.vue` — conditional tabs |
| **MODIFY** | `backend-laravel/routes/tenant.php` — conditional routes |
| **MODIFY** | `backend-laravel/app/Services/ModuleRegistry.php` — module migrations |
| **MODIFY** | `backend-laravel/app/Http/Kernel.php` — register middleware |
