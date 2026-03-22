<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\RestaurantController;

Route::middleware('module:restaurant')->group(function () {
    // Menu Categories
    Route::prefix('restaurant/categories')->group(function () {
        Route::get('/',     [RestaurantController::class, 'categories']);
        Route::post('/',    [RestaurantController::class, 'storeCategory']);
        Route::put('/{id}', [RestaurantController::class, 'updateCategory']);
        Route::delete('/{id}', [RestaurantController::class, 'destroyCategory']);
    });

    // Menu Items
    Route::prefix('restaurant/menu')->group(function () {
        Route::get('/',     [RestaurantController::class, 'menuItems']);
        Route::post('/',    [RestaurantController::class, 'storeItem']);
        Route::get('/{id}', [RestaurantController::class, 'showItem']);
        Route::put('/{id}', [RestaurantController::class, 'updateItem']);
        Route::delete('/{id}', [RestaurantController::class, 'destroyItem']);
    });

    // Reservations
    Route::prefix('restaurant/reservations')->group(function () {
        Route::get('/',     [RestaurantController::class, 'reservations']);
        Route::post('/',    [RestaurantController::class, 'storeReservation']);
        Route::get('/{id}', [RestaurantController::class, 'showReservation']);
        Route::put('/{id}', [RestaurantController::class, 'updateReservation']);
        Route::delete('/{id}', [RestaurantController::class, 'destroyReservation']);
    });

    // Tables
    Route::prefix('restaurant/tables')->group(function () {
        Route::get('/',     [RestaurantController::class, 'tables']);
        Route::post('/',    [RestaurantController::class, 'storeTable']);
        Route::put('/{id}', [RestaurantController::class, 'updateTable']);
        Route::delete('/{id}', [RestaurantController::class, 'destroyTable']);
    });

    // Opening Hours
    Route::prefix('restaurant/hours')->group(function () {
        Route::get('/',     [RestaurantController::class, 'hours']);
        Route::post('/',    [RestaurantController::class, 'storeHour']);
        Route::put('/{id}', [RestaurantController::class, 'updateHour']);
        Route::delete('/{id}', [RestaurantController::class, 'destroyHour']);
    });

    // Stats
    Route::get('/restaurant/stats', [RestaurantController::class, 'stats']);
});

