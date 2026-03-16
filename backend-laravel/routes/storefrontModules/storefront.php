<?php

use Illuminate\Support\Facades\Route;

Route::get('/products', [\App\Http\Controllers\Tenant\StorefrontController::class, 'products']);
Route::get('/products/{slug}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'productDetail']);
Route::get('/products/{slug}/related', [\App\Http\Controllers\Tenant\StorefrontController::class, 'relatedProducts']);
Route::get('/flash-sales/active', [\App\Http\Controllers\Tenant\FlashSalesController::class, 'active']);
Route::get('/categories', [\App\Http\Controllers\Tenant\StorefrontController::class, 'categories']);
Route::get('/brands', [\App\Http\Controllers\Tenant\StorefrontController::class, 'brands']);
Route::get('/banners', [\App\Http\Controllers\Tenant\StorefrontController::class, 'banners']);
Route::get('/pages', [\App\Http\Controllers\Tenant\StorefrontController::class, 'pages']);
Route::get('/pages/{slug}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'pageDetail']);
Route::get('/info', [\App\Http\Controllers\Tenant\StorefrontController::class, 'storeInfo']);
Route::get('/nav-links', [\App\Http\Controllers\Tenant\NavLinksController::class, 'flat']);
Route::post('/checkout', [\App\Http\Controllers\Tenant\StorefrontController::class, 'checkout']);
Route::post('/coupon/validate', [\App\Http\Controllers\Tenant\StorefrontController::class, 'validateCoupon']);
Route::get('/payment-methods', [\App\Http\Controllers\Tenant\StorefrontController::class, 'paymentMethods']);

// Shipping
Route::post('/shipping/calculate', [\App\Http\Controllers\Tenant\ShippingController::class, 'calculate']);
Route::get('/shipping/providers', [\App\Http\Controllers\Tenant\ShippingController::class, 'providers']);
Route::get('/shipping/provinces', [\App\Http\Controllers\Tenant\ShippingController::class, 'provinces']);
Route::get('/shipping/wards/{provinceCode}', [\App\Http\Controllers\Tenant\ShippingController::class, 'wards']);
Route::get('/shipping/vietmap-autocomplete', [\App\Http\Controllers\Tenant\ShippingController::class, 'vietmapAutocomplete']);
Route::get('/orders/{id}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'orderDetail']);
Route::get('/languages', [\App\Http\Controllers\Tenant\StorefrontController::class, 'languages']);
Route::get('/translations/{langCode}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'translations']);
Route::get('/theme', [\App\Http\Controllers\Tenant\StorefrontController::class, 'theme']);
Route::get('/storefront-layout', [\App\Http\Controllers\Tenant\StorefrontController::class, 'storefrontLayout']);
Route::get('/featured-products', [\App\Http\Controllers\Tenant\StorefrontController::class, 'featuredProducts']);
Route::get('/flash-sales', [\App\Http\Controllers\Tenant\StorefrontController::class, 'flashSales']);
Route::get('/orders', [\App\Http\Controllers\Tenant\StorefrontController::class, 'storefrontOrders'])
    ->middleware([\App\Http\Middleware\ShopCustomerAuth::class]);
Route::get('/shipment/{orderId}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'shipmentTracking']);
Route::get('/products/{productId}/reviews', [\App\Http\Controllers\Tenant\StorefrontController::class, 'productReviews']);
Route::post('/products/{productId}/reviews', [\App\Http\Controllers\Tenant\StorefrontController::class, 'createReview'])
    ->middleware([\App\Http\Middleware\ShopCustomerAuth::class]);

// Sitemap
Route::get('/sitemap.xml', [\App\Http\Controllers\Tenant\SitemapController::class, 'index']);

// Robots.txt
Route::get('/robots.txt', [\App\Http\Controllers\Tenant\RobotsTxtController::class, 'index']);

