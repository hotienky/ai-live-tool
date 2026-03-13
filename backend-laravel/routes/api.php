<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Http\Middleware\TenantMiddleware;
use App\Http\Middleware\TokenAuth;

/*
|--------------------------------------------------------------------------
| API Routes — mirrors AdonisJS routes exactly
|--------------------------------------------------------------------------
|
| Structure:
| 1. Health Check (public)
| 2. Storefront API (tenant-scoped, no auth)
| 3. Shop Customer Auth (tenant-scoped, no auth)
| 4. Tenant Auth (tenant-scoped)
| 5. Tenant Admin API (tenant-scoped + auth)
| 6. Master Panel API
*/

// ──── Health Check ────
Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'uptime' => round(microtime(true) - LARAVEL_START, 2),
    'timestamp' => now()->toISOString(),
]));

// ════════════════════════════════════════════════════════════
// ──── STOREFRONT PUBLIC API (tenant-scoped, no auth) ────
// ════════════════════════════════════════════════════════════
Route::middleware([TenantMiddleware::class])->prefix('storefront')->group(function () {
    Route::get('/products', [\App\Http\Controllers\StorefrontController::class, 'products']);
    Route::get('/products/{id}', [\App\Http\Controllers\StorefrontController::class, 'productDetail']);
    Route::get('/categories', [\App\Http\Controllers\StorefrontController::class, 'categories']);
    Route::get('/brands', [\App\Http\Controllers\StorefrontController::class, 'brands']);
    Route::get('/banners', [\App\Http\Controllers\StorefrontController::class, 'banners']);
    Route::get('/pages', [\App\Http\Controllers\StorefrontController::class, 'pages']);
    Route::get('/pages/{id}', [\App\Http\Controllers\StorefrontController::class, 'pageDetail']);
    Route::get('/info', [\App\Http\Controllers\StorefrontController::class, 'storeInfo']);
    Route::post('/checkout', [\App\Http\Controllers\StorefrontController::class, 'checkout']);
    Route::get('/languages', [\App\Http\Controllers\StorefrontController::class, 'languages']);
    Route::get('/translations/{langCode}', [\App\Http\Controllers\StorefrontController::class, 'translations']);
    Route::get('/theme', [\App\Http\Controllers\StorefrontController::class, 'theme']);
    Route::get('/featured-products', [\App\Http\Controllers\StorefrontController::class, 'featuredProducts']);
    Route::get('/flash-sales', fn () => response()->json(DB::table('flash_sales')->where('is_active', true)->where('end_date', '>=', now())->get()));
    Route::get('/orders', fn () => response()->json(DB::table('orders')->orderByDesc('created_at')->limit(50)->get()));
    // Flash sales handled via system route below
});

// Legacy backward-compat storefront
Route::middleware([TenantMiddleware::class])->prefix('shop/store/{storeId}')->group(function () {
    Route::get('/products', [\App\Http\Controllers\StorefrontController::class, 'products']);
    Route::get('/products/{id}', [\App\Http\Controllers\StorefrontController::class, 'productDetail']);
    Route::get('/categories', [\App\Http\Controllers\StorefrontController::class, 'categories']);
    Route::get('/brands', [\App\Http\Controllers\StorefrontController::class, 'brands']);
    Route::get('/banners', [\App\Http\Controllers\StorefrontController::class, 'banners']);
    Route::get('/pages', [\App\Http\Controllers\StorefrontController::class, 'pages']);
    Route::get('/pages/{id}', [\App\Http\Controllers\StorefrontController::class, 'pageDetail']);
    Route::get('/info', [\App\Http\Controllers\StorefrontController::class, 'storeInfo']);
});

// ──── Shop Customer Auth (tenant-scoped, no admin auth) ────
Route::middleware([TenantMiddleware::class])->prefix('shop/auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\ShopAuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\ShopAuthController::class, 'login']);
    Route::get('/me', [\App\Http\Controllers\ShopAuthController::class, 'me']);
    Route::put('/profile', [\App\Http\Controllers\ShopAuthController::class, 'updateProfile']);
    Route::put('/password', [\App\Http\Controllers\ShopAuthController::class, 'changePassword']);
    Route::post('/forgot-password', [\App\Http\Controllers\ShopAuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [\App\Http\Controllers\ShopAuthController::class, 'resetPassword']);
});

// ──── Tenant Auth (tenant-scoped) ────
Route::middleware([TenantMiddleware::class])->prefix('auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\AuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
    Route::get('/me', [\App\Http\Controllers\AuthController::class, 'me'])->middleware(TokenAuth::class);
});

// ════════════════════════════════════════════════════════════
// ──── TENANT ADMIN API (tenant-scoped + authenticated) ────
// ════════════════════════════════════════════════════════════
Route::middleware([TenantMiddleware::class, TokenAuth::class])->group(function () {

    // ── Catalog ──
    Route::get('/products', [\App\Http\Controllers\ProductsController::class, 'index']);
    Route::post('/products', [\App\Http\Controllers\ProductsController::class, 'store']);
    Route::put('/products/{id}', [\App\Http\Controllers\ProductsController::class, 'update']);
    Route::delete('/products/{id}', [\App\Http\Controllers\ProductsController::class, 'destroy']);
    Route::post('/products/{id}/adjust-stock', [\App\Http\Controllers\ProductsController::class, 'adjustStock']);

    Route::get('/categories', [\App\Http\Controllers\CategoriesController::class, 'index']);
    Route::post('/categories', [\App\Http\Controllers\CategoriesController::class, 'store']);
    Route::put('/categories/{id}', [\App\Http\Controllers\CategoriesController::class, 'update']);
    Route::delete('/categories/{id}', [\App\Http\Controllers\CategoriesController::class, 'destroy']);

    Route::get('/brands', [\App\Http\Controllers\BrandsController::class, 'index']);
    Route::post('/brands', [\App\Http\Controllers\BrandsController::class, 'store']);
    Route::put('/brands/{id}', [\App\Http\Controllers\BrandsController::class, 'update']);
    Route::delete('/brands/{id}', [\App\Http\Controllers\BrandsController::class, 'destroy']);

    // ── Commerce ──
    Route::get('/orders', [\App\Http\Controllers\OrdersController::class, 'index']);
    Route::get('/orders/stats', [\App\Http\Controllers\OrdersController::class, 'stats']);
    Route::post('/orders', [\App\Http\Controllers\OrdersController::class, 'store']);
    Route::get('/orders/{id}', [\App\Http\Controllers\OrdersController::class, 'show']);
    Route::put('/orders/{id}', [\App\Http\Controllers\OrdersController::class, 'update']);
    Route::delete('/orders/{id}', [\App\Http\Controllers\OrdersController::class, 'destroy']);
    Route::get('/orders/{id}/details', [\App\Http\Controllers\OrdersController::class, 'getDetails']);
    Route::get('/orders/{id}/totals', [\App\Http\Controllers\OrdersController::class, 'getTotals']);
    Route::get('/orders/{id}/history', [\App\Http\Controllers\OrdersController::class, 'getHistory']);
    Route::put('/orders/{id}/status', [\App\Http\Controllers\OrdersController::class, 'updateStatus']);
    Route::get('/order-statuses', [\App\Http\Controllers\OrdersController::class, 'getOrderStatuses']);
    Route::get('/payment-statuses', [\App\Http\Controllers\OrdersController::class, 'getPaymentStatuses']);

    Route::get('/promotions', [\App\Http\Controllers\PromotionsController::class, 'index']);
    Route::post('/promotions', [\App\Http\Controllers\PromotionsController::class, 'store']);
    Route::put('/promotions/{id}', [\App\Http\Controllers\PromotionsController::class, 'update']);
    Route::delete('/promotions/{id}', [\App\Http\Controllers\PromotionsController::class, 'destroy']);

    Route::get('/shop-customers', [\App\Http\Controllers\ShopCustomersController::class, 'index']);
    Route::post('/shop-customers', [\App\Http\Controllers\ShopCustomersController::class, 'store']);
    Route::get('/shop-customers/{id}', [\App\Http\Controllers\ShopCustomersController::class, 'show']);
    Route::put('/shop-customers/{id}', [\App\Http\Controllers\ShopCustomersController::class, 'update']);
    Route::delete('/shop-customers/{id}', [\App\Http\Controllers\ShopCustomersController::class, 'destroy']);
    Route::get('/shop-customers/{customerId}/addresses', [\App\Http\Controllers\ShopCustomersController::class, 'listAddresses']);
    Route::post('/shop-customers/{customerId}/addresses', [\App\Http\Controllers\ShopCustomersController::class, 'addAddress']);
    Route::put('/shop-customers/{customerId}/addresses/{id}', [\App\Http\Controllers\ShopCustomersController::class, 'updateAddress']);
    Route::delete('/shop-customers/{customerId}/addresses/{id}', [\App\Http\Controllers\ShopCustomersController::class, 'deleteAddress']);

    // ── CRM ──
    Route::get('/leads', [\App\Http\Controllers\LeadsController::class, 'index']);
    Route::get('/leads/stats', [\App\Http\Controllers\LeadsController::class, 'pipelineStats']);
    Route::get('/leads/pipeline-stats', [\App\Http\Controllers\LeadsController::class, 'pipelineStats']);
    Route::get('/leads/{id}', [\App\Http\Controllers\LeadsController::class, 'show']);
    Route::put('/leads/{id}', [\App\Http\Controllers\LeadsController::class, 'update']);
    Route::delete('/leads/{id}', [\App\Http\Controllers\LeadsController::class, 'destroy']);
    Route::get('/leads-pipeline', [\App\Http\Controllers\LeadsController::class, 'pipelineStats']);

    Route::get('/customers', [\App\Http\Controllers\CustomersController::class, 'index']);
    Route::get('/customers/{id}', [\App\Http\Controllers\CustomersController::class, 'show']);
    Route::put('/customers/{id}', [\App\Http\Controllers\CustomersController::class, 'update']);
    Route::delete('/customers/{id}', [\App\Http\Controllers\CustomersController::class, 'destroy']);

    Route::get('/sessions', [\App\Http\Controllers\SessionsController::class, 'index']);
    Route::get('/sessions/{id}', [\App\Http\Controllers\SessionsController::class, 'show']);

    // ── Content ──
    Route::get('/cms-pages', [\App\Http\Controllers\CmsPagesController::class, 'index']);
    Route::post('/cms-pages', [\App\Http\Controllers\CmsPagesController::class, 'store']);
    Route::get('/cms-pages/{id}', [\App\Http\Controllers\CmsPagesController::class, 'show']);
    Route::put('/cms-pages/{id}', [\App\Http\Controllers\CmsPagesController::class, 'update']);
    Route::delete('/cms-pages/{id}', [\App\Http\Controllers\CmsPagesController::class, 'destroy']);

    Route::get('/banners', [\App\Http\Controllers\BannersController::class, 'index']);
    Route::post('/banners', [\App\Http\Controllers\BannersController::class, 'store']);
    Route::put('/banners/{id}', [\App\Http\Controllers\BannersController::class, 'update']);
    Route::delete('/banners/{id}', [\App\Http\Controllers\BannersController::class, 'destroy']);

    Route::get('/nav-links', [\App\Http\Controllers\NavLinksController::class, 'index']);
    Route::get('/nav-links/flat', [\App\Http\Controllers\NavLinksController::class, 'flat']);
    Route::post('/nav-links', [\App\Http\Controllers\NavLinksController::class, 'store']);
    Route::put('/nav-links/{id}', [\App\Http\Controllers\NavLinksController::class, 'update']);
    Route::delete('/nav-links/{id}', [\App\Http\Controllers\NavLinksController::class, 'destroy']);
    Route::post('/nav-links/reorder', [\App\Http\Controllers\NavLinksController::class, 'reorder']);

    // ── System ──
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'overview']);
    Route::get('/dashboard/overview', [\App\Http\Controllers\DashboardController::class, 'overview']);
    Route::get('/dashboard/recent-leads', [\App\Http\Controllers\DashboardController::class, 'recentLeads']);
    Route::get('/dashboard/analytics', [\App\Http\Controllers\DashboardController::class, 'analytics']);
    Route::get('/dashboard/top-customers', [\App\Http\Controllers\DashboardController::class, 'topCustomers']);
    Route::get('/dashboard/order-stats', [\App\Http\Controllers\DashboardController::class, 'orderStats']);

    Route::get('/notifications', fn () => response()->json([]));
    Route::get('/notifications/unread-count', fn () => response()->json(['count' => 0]));
    Route::put('/notifications/{id}/read', fn () => response()->json(['success' => true]));
    Route::put('/notifications/read-all', fn () => response()->json(['success' => true]));

    Route::get('/webhooks', fn () => response()->json(DB::table('webhooks')->get()));
    Route::post('/webhooks', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::table('webhooks')->insertGetId($d); return response()->json(DB::table('webhooks')->where('id', $id)->first(), 201); });
    Route::put('/webhooks/{id}', function (\Illuminate\Http\Request $r, $id) { $d = $r->all(); $d['updated_at'] = now(); DB::table('webhooks')->where('id', $id)->update($d); return response()->json(DB::table('webhooks')->where('id', $id)->first()); });
    Route::delete('/webhooks/{id}', function ($id) { DB::table('webhooks')->where('id', $id)->delete(); return response()->json(['success' => true]); });

    Route::get('/activity-logs', fn () => response()->json(DB::table('activity_logs')->orderByDesc('created_at')->limit(100)->get()));
    Route::get('/activity-logs/stats', fn () => response()->json(['total' => DB::table('activity_logs')->count()]));

    Route::get('/roles', [\App\Http\Controllers\RolesController::class, 'index']);
    Route::get('/roles/permissions', [\App\Http\Controllers\RolesController::class, 'permissions']);
    Route::post('/roles', [\App\Http\Controllers\RolesController::class, 'store']);
    Route::get('/roles/{id}', [\App\Http\Controllers\RolesController::class, 'show']);
    Route::put('/roles/{id}', [\App\Http\Controllers\RolesController::class, 'update']);
    Route::delete('/roles/{id}', [\App\Http\Controllers\RolesController::class, 'destroy']);
    Route::get('/users', [\App\Http\Controllers\RolesController::class, 'users']);
    Route::put('/users/{id}/role', [\App\Http\Controllers\RolesController::class, 'assignRole']);

    Route::get('/system-config', [\App\Http\Controllers\SystemConfigController::class, 'index']);
    Route::post('/system-config', [\App\Http\Controllers\SystemConfigController::class, 'store']);
    Route::get('/system-config/group/{group}', [\App\Http\Controllers\SystemConfigController::class, 'showGroup']);
    Route::put('/system-config/group/{group}', [\App\Http\Controllers\SystemConfigController::class, 'updateGroup']);

    Route::get('/api-keys', fn () => response()->json(DB::table('api_keys')->get()));
    Route::post('/api-keys', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['key'] = bin2hex(random_bytes(16)); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::table('api_keys')->insertGetId($d); return response()->json(DB::table('api_keys')->where('id', $id)->first(), 201); });
    Route::put('/api-keys/{id}', function (\Illuminate\Http\Request $r, $id) { $d = $r->all(); $d['updated_at'] = now(); DB::table('api_keys')->where('id', $id)->update($d); return response()->json(DB::table('api_keys')->where('id', $id)->first()); });
    Route::delete('/api-keys/{id}', function ($id) { DB::table('api_keys')->where('id', $id)->delete(); return response()->json(['success' => true]); });

    Route::get('/languages', fn () => response()->json(DB::table('languages')->orderBy('sort')->get()));
    Route::post('/languages', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::table('languages')->insertGetId($d); return response()->json(DB::table('languages')->where('id', $id)->first(), 201); });
    Route::put('/languages/{id}', function (\Illuminate\Http\Request $r, $id) { $d = $r->all(); $d['updated_at'] = now(); DB::table('languages')->where('id', $id)->update($d); return response()->json(DB::table('languages')->where('id', $id)->first()); });
    Route::delete('/languages/{id}', function ($id) { DB::table('languages')->where('id', $id)->delete(); return response()->json(['success' => true]); });
    Route::get('/languages/{id}/translations', function ($id) { return response()->json(DB::table('language_translations')->where('language_id', $id)->get()); });
    Route::put('/languages/{id}/translations', function (\Illuminate\Http\Request $r, $id) {
        $translations = $r->all();
        foreach ($translations as $group => $keys) {
            if (is_array($keys)) {
                foreach ($keys as $key => $value) {
                    DB::table('language_translations')->updateOrInsert(['language_id' => $id, 'group' => $group, 'key' => $key], ['value' => $value]);
                }
            }
        }
        return response()->json(['success' => true]);
    });

    Route::get('/custom-fields', fn () => response()->json(DB::table('custom_fields')->orderBy('sort')->get()));
    Route::post('/custom-fields', function (\Illuminate\Http\Request $r) { $d = $r->all(); if (isset($d['options']) && !is_string($d['options'])) $d['options'] = json_encode($d['options']); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::table('custom_fields')->insertGetId($d); return response()->json(DB::table('custom_fields')->where('id', $id)->first(), 201); });
    Route::put('/custom-fields/{id}', function (\Illuminate\Http\Request $r, $id) { $d = $r->all(); if (isset($d['options']) && !is_string($d['options'])) $d['options'] = json_encode($d['options']); $d['updated_at'] = now(); DB::table('custom_fields')->where('id', $id)->update($d); return response()->json(DB::table('custom_fields')->where('id', $id)->first()); });
    Route::delete('/custom-fields/{id}', function ($id) { DB::table('custom_fields')->where('id', $id)->delete(); return response()->json(['success' => true]); });
    Route::get('/custom-fields/values/{entityType}/{entityId}', function ($entityType, $entityId) { return response()->json(DB::table('custom_field_values')->where('entity_type', $entityType)->where('entity_id', $entityId)->get()); });
    Route::put('/custom-fields/values/{entityType}/{entityId}', function (\Illuminate\Http\Request $r, $entityType, $entityId) {
        $values = $r->all();
        foreach ($values as $fieldId => $value) {
            DB::table('custom_field_values')->updateOrInsert(['custom_field_id' => $fieldId, 'entity_type' => $entityType, 'entity_id' => $entityId], ['value' => is_string($value) ? $value : json_encode($value)]);
        }
        return response()->json(['success' => true]);
    });

    Route::get('/flash-sales', fn () => response()->json(DB::table('flash_sales')->orderByDesc('created_at')->get()));
    Route::get('/flash-sales/{id}', function ($id) { return response()->json(DB::table('flash_sales')->where('id', $id)->first()); });
    Route::post('/flash-sales', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::table('flash_sales')->insertGetId($d); return response()->json(DB::table('flash_sales')->where('id', $id)->first(), 201); });
    Route::put('/flash-sales/{id}', function (\Illuminate\Http\Request $r, $id) { $d = $r->all(); $d['updated_at'] = now(); DB::table('flash_sales')->where('id', $id)->update($d); return response()->json(DB::table('flash_sales')->where('id', $id)->first()); });
    Route::delete('/flash-sales/{id}', function ($id) { DB::table('flash_sales')->where('id', $id)->delete(); return response()->json(['success' => true]); });

    // ── Live ──
    Route::get('/shops', [\App\Http\Controllers\ShopsController::class, 'index']);
    Route::post('/shops', [\App\Http\Controllers\ShopsController::class, 'store']);
    Route::post('/shops/find-or-create', [\App\Http\Controllers\ShopsController::class, 'findOrCreate']);
    Route::get('/shops/{id}', [\App\Http\Controllers\ShopsController::class, 'show']);
    Route::put('/shops/{id}', [\App\Http\Controllers\ShopsController::class, 'update']);
    Route::delete('/shops/{id}', [\App\Http\Controllers\ShopsController::class, 'destroy']);
    Route::post('/shops/{id}/connect', function (\Illuminate\Http\Request $r, $id) { DB::table('shops')->where('id', $id)->update(['is_connected' => true, 'access_token' => $r->input('access_token'), 'updated_at' => now()]); return response()->json(DB::table('shops')->where('id', $id)->first()); });
    Route::post('/shops/{id}/disconnect', function ($id) { DB::table('shops')->where('id', $id)->update(['is_connected' => false, 'access_token' => null, 'updated_at' => now()]); return response()->json(['success' => true]); });

    // ── Coupons ──
    Route::get('/coupons', fn () => response()->json(DB::table('coupons')->orderByDesc('created_at')->get()));
    Route::post('/coupons', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::table('coupons')->insertGetId($d); return response()->json(DB::table('coupons')->where('id', $id)->first(), 201); });
    Route::put('/coupons/{id}', function (\Illuminate\Http\Request $r, $id) { $d = $r->all(); $d['updated_at'] = now(); DB::table('coupons')->where('id', $id)->update($d); return response()->json(DB::table('coupons')->where('id', $id)->first()); });
    Route::delete('/coupons/{id}', function ($id) { DB::table('coupons')->where('id', $id)->delete(); return response()->json(['success' => true]); });
    Route::post('/coupons/validate', function (\Illuminate\Http\Request $r) {
        $code = $r->input('code');
        $coupon = DB::table('coupons')->where('code', $code)->where('is_active', true)->first();
        if (!$coupon) return response()->json(['valid' => false, 'message' => 'Mã không hợp lệ'], 404);
        return response()->json(['valid' => true, 'coupon' => $coupon]);
    });

    // ── Cart ──
    Route::get('/cart', fn (\Illuminate\Http\Request $r) => response()->json(DB::table('cart_items')->where('user_id', $r->attributes->get('auth_user')->id ?? 0)->get()));
    Route::post('/cart/items', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['user_id'] = $r->attributes->get('auth_user')->id ?? 0; $d['created_at'] = now(); $id = DB::table('cart_items')->insertGetId($d); return response()->json(DB::table('cart_items')->where('id', $id)->first(), 201); });
    Route::put('/cart/items/{productId}', function (\Illuminate\Http\Request $r, $productId) { $userId = $r->attributes->get('auth_user')->id ?? 0; DB::table('cart_items')->where('user_id', $userId)->where('product_id', $productId)->update($r->only(['quantity'])); return response()->json(DB::table('cart_items')->where('user_id', $userId)->where('product_id', $productId)->first()); });
    Route::delete('/cart/items/{productId}', function (\Illuminate\Http\Request $r, $productId) { $userId = $r->attributes->get('auth_user')->id ?? 0; DB::table('cart_items')->where('user_id', $userId)->where('product_id', $productId)->delete(); return response()->json(['success' => true]); });


    Route::get('/keywords', [\App\Http\Controllers\KeywordsController::class, 'index']);
    Route::post('/keywords', [\App\Http\Controllers\KeywordsController::class, 'store']);
    Route::delete('/keywords/{id}', [\App\Http\Controllers\KeywordsController::class, 'destroy']);

    Route::get('/templates', fn () => response()->json(DB::table('auto_reply_templates')->get()));
    Route::post('/templates', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::table('auto_reply_templates')->insertGetId($d); return response()->json(DB::table('auto_reply_templates')->where('id', $id)->first(), 201); });
    Route::delete('/templates/{id}', function ($id) { DB::table('auto_reply_templates')->where('id', $id)->delete(); return response()->json(['success' => true]); });

    Route::get('/export/leads', fn () => response()->json(DB::table('leads')->get()));
    Route::get('/export/comments', fn () => response()->json(DB::table('chat_logs')->orderByDesc('created_at')->limit(500)->get()));
    Route::get('/export/customers', fn () => response()->json(DB::table('customers')->get()));
    Route::get('/export/report', fn () => response()->json(['message' => 'Report generated']));

    // Profile & Password
    Route::put('/auth/profile', function (\Illuminate\Http\Request $r) {
        $user = $r->attributes->get('auth_user');
        $fullName = $r->input('fullName');
        if ($fullName) DB::table('users')->where('id', $user->id)->update(['full_name' => $fullName, 'updated_at' => now()]);
        $updated = DB::table('users')->select('id', 'email', 'full_name', 'role')->where('id', $user->id)->first();
        return response()->json($updated);
    });

    Route::put('/auth/password', function (\Illuminate\Http\Request $r) {
        $user = $r->attributes->get('auth_user');
        $data = $r->only(['currentPassword', 'newPassword']);
        if (!$data['currentPassword'] || !$data['newPassword']) return response()->json(['error' => 'Thiếu thông tin'], 400);
        $fullUser = DB::table('users')->where('id', $user->id)->first();
        if (!Hash::check($data['currentPassword'], $fullUser->password)) return response()->json(['error' => 'Mật khẩu hiện tại không đúng'], 400);
        DB::table('users')->where('id', $user->id)->update(['password' => Hash::make($data['newPassword']), 'updated_at' => now()]);
        return response()->json(['message' => 'Đổi mật khẩu thành công']);
    });
});

// ════════════════════════════════════════════════════════════
// ──── MASTER PANEL API ────
// ════════════════════════════════════════════════════════════
Route::prefix('master/auth')->group(function () {
    Route::post('/login', function (\Illuminate\Http\Request $request) {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = DB::connection('master')->table('master_users')->where('email', $data['email'])->first();
        if (!$user) return response()->json(['error' => 'Invalid credentials'], 401);

        // Handle both bcrypt (Laravel) and scrypt (AdonisJS legacy) password hashes
        $passwordValid = false;
        try {
            $passwordValid = Hash::check($data['password'], $user->password);
        } catch (\RuntimeException $e) {
            // AdonisJS scrypt hash — try password_verify as fallback
            $passwordValid = password_verify($data['password'], $user->password);
        }

        if (!$passwordValid) return response()->json(['error' => 'Invalid credentials'], 401);

        // Auto-rehash to bcrypt for future logins
        if (!str_starts_with($user->password, '$2y$') && !str_starts_with($user->password, '$2b$')) {
            DB::connection('master')->table('master_users')->where('id', $user->id)
                ->update(['password' => Hash::make($data['password']), 'updated_at' => now()]);
        }

        $token = bin2hex(random_bytes(32));
        DB::connection('master')->table('master_access_tokens')->insert(['user_id' => $user->id, 'token' => $token, 'created_at' => now(), 'expires_at' => now()->addDays(30)]);
        return response()->json(['user' => ['id' => $user->id, 'email' => $user->email, 'name' => $user->name, 'role' => $user->role], 'token' => $token]);
    });
});

// Master protected routes
Route::prefix('master')->middleware(\App\Http\Middleware\MasterAuth::class)->group(function () {
    Route::get('/auth/me', fn (\Illuminate\Http\Request $r) => response()->json($r->attributes->get('masterUser')));
    Route::post('/auth/logout', fn () => response()->json(['success' => true]));

    // Tenant CRUD
    Route::get('/tenants', fn () => response()->json(DB::connection('master')->table('tenants')->get()));
    Route::get('/tenants/{id}', fn ($id) => response()->json(DB::connection('master')->table('tenants')->where('id', $id)->first()));
    Route::post('/tenants', function (\Illuminate\Http\Request $r) { $d = $r->all(); $d['created_at'] = now(); $d['updated_at'] = now(); $id = DB::connection('master')->table('tenants')->insertGetId($d); return response()->json(DB::connection('master')->table('tenants')->where('id', $id)->first(), 201); });
    Route::put('/tenants/{id}', function (\Illuminate\Http\Request $r, $id) { $d = $r->all(); $d['updated_at'] = now(); DB::connection('master')->table('tenants')->where('id', $id)->update($d); return response()->json(DB::connection('master')->table('tenants')->where('id', $id)->first()); });
    Route::delete('/tenants/{id}', function ($id) { DB::connection('master')->table('tenants')->where('id', $id)->delete(); return response()->json(['success' => true]); });

    Route::post('/tenants/{id}/suspend', function ($id) { DB::connection('master')->table('tenants')->where('id', $id)->update(['status' => 'suspended']); return response()->json(['success' => true]); });
    Route::post('/tenants/{id}/activate', function ($id) { DB::connection('master')->table('tenants')->where('id', $id)->update(['status' => 'active']); return response()->json(['success' => true]); });
    Route::post('/tenants/{id}/migrate', fn ($id) => response()->json(['message' => 'Migration not available in Laravel mode']));
    Route::post('/tenants/{id}/seed', fn ($id) => response()->json(['message' => 'Seed not available in Laravel mode']));
});

