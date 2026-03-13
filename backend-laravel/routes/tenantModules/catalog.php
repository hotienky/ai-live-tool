<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ProductsController;
use App\Http\Controllers\Tenant\CategoriesController;
use App\Http\Controllers\Tenant\BrandsController;

// Products
Route::get('/products', [ProductsController::class, 'index']);
Route::post('/products', [ProductsController::class, 'store']);
Route::put('/products/{id}', [ProductsController::class, 'update']);
Route::delete('/products/{id}', [ProductsController::class, 'destroy']);
Route::post('/products/{id}/adjust-stock', [ProductsController::class, 'adjustStock']);

// Categories
Route::get('/categories', [CategoriesController::class, 'index']);
Route::post('/categories', [CategoriesController::class, 'store']);
Route::put('/categories/{id}', [CategoriesController::class, 'update']);
Route::delete('/categories/{id}', [CategoriesController::class, 'destroy']);

// Brands
Route::get('/brands', [BrandsController::class, 'index']);
Route::post('/brands', [BrandsController::class, 'store']);
Route::put('/brands/{id}', [BrandsController::class, 'update']);
Route::delete('/brands/{id}', [BrandsController::class, 'destroy']);
