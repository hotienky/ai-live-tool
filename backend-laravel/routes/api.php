<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\TenantMiddleware;
use App\Http\Middleware\TokenAuth;

/*
|--------------------------------------------------------------------------
| API Routes — Modular Architecture
|--------------------------------------------------------------------------
|
| Structure (matches ARCHITECTURE.md):
| 1. Health Check (public)
| 2. Storefront API (tenant-scoped, no auth) → storefrontModules/
| 3. Legacy Storefront backward-compat
| 4. Shop Customer Auth (tenant-scoped, no auth)
| 5. Tenant Auth (tenant-scoped)
| 6. Tenant Admin API (tenant-scoped + auth) → tenantModules/
| 7. Master Panel API → masterModules/
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
    foreach (glob(__DIR__ . '/storefrontModules/*.php') as $file) {
        require $file;
    }
});

// Legacy backward-compat storefront
Route::middleware([TenantMiddleware::class])->prefix('shop/store/{storeId}')->group(function () {
    Route::get('/products', [\App\Http\Controllers\Tenant\StorefrontController::class, 'products']);
    Route::get('/products/{id}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'productDetail']);
    Route::get('/categories', [\App\Http\Controllers\Tenant\StorefrontController::class, 'categories']);
    Route::get('/brands', [\App\Http\Controllers\Tenant\StorefrontController::class, 'brands']);
    Route::get('/banners', [\App\Http\Controllers\Tenant\StorefrontController::class, 'banners']);
    Route::get('/pages', [\App\Http\Controllers\Tenant\StorefrontController::class, 'pages']);
    Route::get('/pages/{id}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'pageDetail']);
    Route::get('/info', [\App\Http\Controllers\Tenant\StorefrontController::class, 'storeInfo']);
});

// ──── Shop Customer Auth (tenant-scoped, no admin auth) ────
Route::middleware([TenantMiddleware::class])->prefix('shop/auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Shop\ShopAuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\Shop\ShopAuthController::class, 'login']);
    Route::get('/me', [\App\Http\Controllers\Shop\ShopAuthController::class, 'me']);
    Route::put('/profile', [\App\Http\Controllers\Shop\ShopAuthController::class, 'updateProfile']);
    Route::put('/password', [\App\Http\Controllers\Shop\ShopAuthController::class, 'changePassword']);
    Route::post('/forgot-password', [\App\Http\Controllers\Shop\ShopAuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [\App\Http\Controllers\Shop\ShopAuthController::class, 'resetPassword']);
});

// ──── Tenant Auth (tenant-scoped) ────
Route::middleware([TenantMiddleware::class])->prefix('auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Tenant\AuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\Tenant\AuthController::class, 'login']);
    Route::get('/me', [\App\Http\Controllers\Tenant\AuthController::class, 'me'])->middleware(TokenAuth::class);
});

// ════════════════════════════════════════════════════════════
// ──── TENANT ADMIN API (tenant-scoped + authenticated) ────
// ════════════════════════════════════════════════════════════
Route::middleware([TenantMiddleware::class, TokenAuth::class])->group(function () {
    foreach (glob(__DIR__ . '/tenantModules/*.php') as $file) {
        require $file;
    }
});

// ════════════════════════════════════════════════════════════
// ──── MASTER PANEL API ────
// ════════════════════════════════════════════════════════════
Route::prefix('master/auth')->group(function () {
    foreach (glob(__DIR__ . '/masterModules/auth.php') as $file) {
        require $file;
    }
});

Route::prefix('master')->middleware(\App\Http\Middleware\MasterAuth::class)->group(function () {
    require __DIR__ . '/masterModules/tenants.php';
});
