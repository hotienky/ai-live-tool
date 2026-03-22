<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;

/*
|--------------------------------------------------------------------------
| Salon Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:salon')->prefix('salon')->group(function () {
    Route::get('/services', [PluginStorefrontController::class, 'salonServices']);
    Route::get('/staff', [PluginStorefrontController::class, 'salonStaffList']);
    Route::get('/available-slots', [PluginStorefrontController::class, 'salonAvailableSlots']);
    Route::post('/appointments', [PluginStorefrontController::class, 'salonBookAppointment'])
        ->middleware('throttle:10,1');
});
