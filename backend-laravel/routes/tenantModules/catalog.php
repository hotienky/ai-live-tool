<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ProductsController;
use App\Http\Controllers\Tenant\CategoriesController;
use App\Http\Controllers\Tenant\BrandsController;

// ════════════════════════════════════════════════════════════
// CATALOG ROUTES (require ecom module)
// ════════════════════════════════════════════════════════════
Route::middleware('module:ecom')->group(function () {
    // Products
    Route::get('/products', [ProductsController::class, 'index'])->middleware('permission:products.view');
    Route::get('/products/{id}', [ProductsController::class, 'show'])->middleware('permission:products.view');
    Route::post('/products', [ProductsController::class, 'store'])->middleware('permission:products.create');
    Route::put('/products/{id}', [ProductsController::class, 'update'])->middleware('permission:products.edit');
    Route::delete('/products/{id}', [ProductsController::class, 'destroy'])->middleware('permission:products.delete');
    Route::post('/products/{id}/adjust-stock', [ProductsController::class, 'adjustStock'])->middleware('permission:products.edit');

    // Categories
    Route::get('/categories', [CategoriesController::class, 'index'])->middleware('permission:products.view');
    Route::get('/categories/{id}', [CategoriesController::class, 'show'])->middleware('permission:products.view');
    Route::post('/categories', [CategoriesController::class, 'store'])->middleware('permission:products.create');
    Route::put('/categories/{id}', [CategoriesController::class, 'update'])->middleware('permission:products.edit');
    Route::delete('/categories/{id}', [CategoriesController::class, 'destroy'])->middleware('permission:products.delete');

    // Brands
    Route::get('/brands', [BrandsController::class, 'index'])->middleware('permission:products.view');
    Route::get('/brands/{id}', [BrandsController::class, 'show'])->middleware('permission:products.view');
    Route::post('/brands', [BrandsController::class, 'store'])->middleware('permission:products.create');
    Route::put('/brands/{id}', [BrandsController::class, 'update'])->middleware('permission:products.edit');
    Route::delete('/brands/{id}', [BrandsController::class, 'destroy'])->middleware('permission:products.delete');
});

