<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\BookingController;

Route::middleware('module:booking')->group(function () {
    // Services
    Route::prefix('booking/services')->group(function () {
        Route::get('/',     [BookingController::class, 'services']);
        Route::post('/',    [BookingController::class, 'storeService']);
        Route::get('/{id}', [BookingController::class, 'showService']);
        Route::put('/{id}', [BookingController::class, 'updateService']);
        Route::delete('/{id}', [BookingController::class, 'destroyService']);
    });

    // Appointments
    Route::prefix('booking/appointments')->group(function () {
        Route::get('/',     [BookingController::class, 'appointments']);
        Route::post('/',    [BookingController::class, 'storeAppointment']);
        Route::get('/{id}', [BookingController::class, 'showAppointment']);
        Route::put('/{id}', [BookingController::class, 'updateAppointment']);
        Route::delete('/{id}', [BookingController::class, 'destroyAppointment']);
    });

    // Calendar
    Route::get('/booking/calendar', [BookingController::class, 'calendar']);

    // Stats Dashboard
    Route::get('/booking/stats', [BookingController::class, 'stats']);
});
