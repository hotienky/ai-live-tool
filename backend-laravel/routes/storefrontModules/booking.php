<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;

/*
|--------------------------------------------------------------------------
| Booking Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:booking')->prefix('booking')->group(function () {
    Route::get('/services', [PluginStorefrontController::class, 'bookingServices']);
    Route::get('/services/{id}', [PluginStorefrontController::class, 'bookingServiceDetail']);
    Route::get('/available-slots', [PluginStorefrontController::class, 'bookingAvailableSlots']);
    Route::post('/appointments', [PluginStorefrontController::class, 'bookingStore'])
        ->middleware('throttle:10,1'); // max 10 per minute
});
