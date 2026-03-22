<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\SalonController;

Route::middleware('module:salon')->group(function () {
    // Services
    Route::prefix('salon/services')->group(function () {
        Route::get('/',     [SalonController::class, 'services']);
        Route::post('/',    [SalonController::class, 'storeService']);
        Route::get('/{id}', [SalonController::class, 'showService']);
        Route::put('/{id}', [SalonController::class, 'updateService']);
        Route::delete('/{id}', [SalonController::class, 'destroyService']);
    });

    // Staff
    Route::prefix('salon/staff')->group(function () {
        Route::get('/',     [SalonController::class, 'staff']);
        Route::post('/',    [SalonController::class, 'storeStaff']);
        Route::get('/{id}', [SalonController::class, 'showStaff']);
        Route::put('/{id}', [SalonController::class, 'updateStaff']);
        Route::delete('/{id}', [SalonController::class, 'destroyStaff']);
    });

    // Appointments
    Route::prefix('salon/appointments')->group(function () {
        Route::get('/',     [SalonController::class, 'appointments']);
        Route::post('/',    [SalonController::class, 'storeAppointment']);
        Route::get('/{id}', [SalonController::class, 'showAppointment']);
        Route::put('/{id}', [SalonController::class, 'updateAppointment']);
        Route::delete('/{id}', [SalonController::class, 'destroyAppointment']);
    });

    // Calendar & Stats
    Route::get('/salon/calendar', [SalonController::class, 'calendar']);
    Route::get('/salon/stats', [SalonController::class, 'stats']);
});

