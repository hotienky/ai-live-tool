<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\OrdersController;
use App\Http\Controllers\Tenant\CartController;
use App\Http\Controllers\Tenant\PromotionsController;
use App\Http\Controllers\Tenant\ShopCustomersController;
use App\Http\Controllers\Tenant\CouponsController;

// Orders
Route::get('/orders', [OrdersController::class, 'index'])->middleware('permission:orders.view');
Route::get('/orders/stats', [OrdersController::class, 'stats'])->middleware('permission:orders.view');
Route::post('/orders', [OrdersController::class, 'store'])->middleware('permission:orders.create');
Route::get('/orders/{id}', [OrdersController::class, 'show'])->middleware('permission:orders.view');
Route::put('/orders/{id}', [OrdersController::class, 'update'])->middleware('permission:orders.edit');
Route::delete('/orders/{id}', [OrdersController::class, 'destroy'])->middleware('permission:orders.delete');
Route::get('/orders/{id}/details', [OrdersController::class, 'getDetails'])->middleware('permission:orders.view');
Route::get('/orders/{id}/totals', [OrdersController::class, 'getTotals'])->middleware('permission:orders.view');
Route::get('/orders/{id}/history', [OrdersController::class, 'getHistory'])->middleware('permission:orders.view');
Route::put('/orders/{id}/status', [OrdersController::class, 'updateStatus'])->middleware('permission:orders.edit');
Route::get('/order-statuses', [OrdersController::class, 'getOrderStatuses'])->middleware('permission:orders.view');
Route::get('/payment-statuses', [OrdersController::class, 'getPaymentStatuses'])->middleware('permission:orders.view');

// Cart (no permission needed — internal use)
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'addItem']);
Route::put('/cart/items/{productId}', [CartController::class, 'updateItem']);
Route::delete('/cart/items/{productId}', [CartController::class, 'removeItem']);

// Promotions
Route::get('/promotions', [PromotionsController::class, 'index'])->middleware('permission:promotions.view');
Route::post('/promotions', [PromotionsController::class, 'store'])->middleware('permission:promotions.create');
Route::put('/promotions/{id}', [PromotionsController::class, 'update'])->middleware('permission:promotions.edit');
Route::delete('/promotions/{id}', [PromotionsController::class, 'destroy'])->middleware('permission:promotions.delete');

// Shop Customers
Route::get('/shop-customers', [ShopCustomersController::class, 'index'])->middleware('permission:customers.view');
Route::post('/shop-customers', [ShopCustomersController::class, 'store'])->middleware('permission:customers.edit');
Route::get('/shop-customers/{id}', [ShopCustomersController::class, 'show'])->middleware('permission:customers.view');
Route::put('/shop-customers/{id}', [ShopCustomersController::class, 'update'])->middleware('permission:customers.edit');
Route::delete('/shop-customers/{id}', [ShopCustomersController::class, 'destroy'])->middleware('permission:customers.delete');
Route::get('/shop-customers/{customerId}/addresses', [ShopCustomersController::class, 'listAddresses'])->middleware('permission:customers.view');
Route::post('/shop-customers/{customerId}/addresses', [ShopCustomersController::class, 'addAddress'])->middleware('permission:customers.edit');
Route::put('/shop-customers/{customerId}/addresses/{id}', [ShopCustomersController::class, 'updateAddress'])->middleware('permission:customers.edit');
Route::delete('/shop-customers/{customerId}/addresses/{id}', [ShopCustomersController::class, 'deleteAddress'])->middleware('permission:customers.delete');

// Coupons
Route::get('/coupons', [CouponsController::class, 'index'])->middleware('permission:promotions.view');
Route::post('/coupons', [CouponsController::class, 'store'])->middleware('permission:promotions.create');
Route::put('/coupons/{id}', [CouponsController::class, 'update'])->middleware('permission:promotions.edit');
Route::delete('/coupons/{id}', [CouponsController::class, 'destroy'])->middleware('permission:promotions.delete');
Route::post('/coupons/validate', [CouponsController::class, 'validate'])->middleware('permission:promotions.view');
