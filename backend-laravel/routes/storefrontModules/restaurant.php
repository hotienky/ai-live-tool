<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;

/*
|--------------------------------------------------------------------------
| Restaurant Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:restaurant')->prefix('restaurant')->group(function () {
    Route::get('/menu', [PluginStorefrontController::class, 'restaurantMenu']);
    Route::get('/menu/{id}', [PluginStorefrontController::class, 'restaurantMenuItemDetail']);
    Route::get('/available-times', [PluginStorefrontController::class, 'restaurantAvailableTimes']);
    Route::post('/reservations', [PluginStorefrontController::class, 'restaurantReserve'])
        ->middleware('throttle:5,1');
});
