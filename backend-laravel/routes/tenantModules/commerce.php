<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\OrdersController;
use App\Http\Controllers\Tenant\CartController;
use App\Http\Controllers\Tenant\PromotionsController;
use App\Http\Controllers\Tenant\ShopCustomersController;
use App\Http\Controllers\Tenant\CouponsController;

// Orders
Route::get('/orders', [OrdersController::class, 'index']);
Route::get('/orders/stats', [OrdersController::class, 'stats']);
Route::post('/orders', [OrdersController::class, 'store']);
Route::get('/orders/{id}', [OrdersController::class, 'show']);
Route::put('/orders/{id}', [OrdersController::class, 'update']);
Route::delete('/orders/{id}', [OrdersController::class, 'destroy']);
Route::get('/orders/{id}/details', [OrdersController::class, 'getDetails']);
Route::get('/orders/{id}/totals', [OrdersController::class, 'getTotals']);
Route::get('/orders/{id}/history', [OrdersController::class, 'getHistory']);
Route::put('/orders/{id}/status', [OrdersController::class, 'updateStatus']);
Route::get('/order-statuses', [OrdersController::class, 'getOrderStatuses']);
Route::get('/payment-statuses', [OrdersController::class, 'getPaymentStatuses']);

// Cart
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'addItem']);
Route::put('/cart/items/{productId}', [CartController::class, 'updateItem']);
Route::delete('/cart/items/{productId}', [CartController::class, 'removeItem']);

// Promotions
Route::get('/promotions', [PromotionsController::class, 'index']);
Route::post('/promotions', [PromotionsController::class, 'store']);
Route::put('/promotions/{id}', [PromotionsController::class, 'update']);
Route::delete('/promotions/{id}', [PromotionsController::class, 'destroy']);

// Shop Customers
Route::get('/shop-customers', [ShopCustomersController::class, 'index']);
Route::post('/shop-customers', [ShopCustomersController::class, 'store']);
Route::get('/shop-customers/{id}', [ShopCustomersController::class, 'show']);
Route::put('/shop-customers/{id}', [ShopCustomersController::class, 'update']);
Route::delete('/shop-customers/{id}', [ShopCustomersController::class, 'destroy']);
Route::get('/shop-customers/{customerId}/addresses', [ShopCustomersController::class, 'listAddresses']);
Route::post('/shop-customers/{customerId}/addresses', [ShopCustomersController::class, 'addAddress']);
Route::put('/shop-customers/{customerId}/addresses/{id}', [ShopCustomersController::class, 'updateAddress']);
Route::delete('/shop-customers/{customerId}/addresses/{id}', [ShopCustomersController::class, 'deleteAddress']);

// Coupons
Route::get('/coupons', [CouponsController::class, 'index']);
Route::post('/coupons', [CouponsController::class, 'store']);
Route::put('/coupons/{id}', [CouponsController::class, 'update']);
Route::delete('/coupons/{id}', [CouponsController::class, 'destroy']);
Route::post('/coupons/validate', [CouponsController::class, 'validate']);
