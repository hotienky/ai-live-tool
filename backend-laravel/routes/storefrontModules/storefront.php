<?php

use Illuminate\Support\Facades\Route;

Route::get('/products', [\App\Http\Controllers\Tenant\StorefrontController::class, 'products']);
Route::get('/products/{id}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'productDetail']);
Route::get('/categories', [\App\Http\Controllers\Tenant\StorefrontController::class, 'categories']);
Route::get('/brands', [\App\Http\Controllers\Tenant\StorefrontController::class, 'brands']);
Route::get('/banners', [\App\Http\Controllers\Tenant\StorefrontController::class, 'banners']);
Route::get('/pages', [\App\Http\Controllers\Tenant\StorefrontController::class, 'pages']);
Route::get('/pages/{id}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'pageDetail']);
Route::get('/info', [\App\Http\Controllers\Tenant\StorefrontController::class, 'storeInfo']);
Route::post('/checkout', [\App\Http\Controllers\Tenant\StorefrontController::class, 'checkout']);
Route::get('/languages', [\App\Http\Controllers\Tenant\StorefrontController::class, 'languages']);
Route::get('/translations/{langCode}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'translations']);
Route::get('/theme', [\App\Http\Controllers\Tenant\StorefrontController::class, 'theme']);
Route::get('/featured-products', [\App\Http\Controllers\Tenant\StorefrontController::class, 'featuredProducts']);
Route::get('/flash-sales', [\App\Http\Controllers\Tenant\StorefrontController::class, 'flashSales']);
Route::get('/orders', [\App\Http\Controllers\Tenant\StorefrontController::class, 'storefrontOrders']);
