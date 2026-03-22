<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;
use App\Http\Controllers\Tenant\ContentController;

/*
|--------------------------------------------------------------------------
| Events Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:events')->prefix('events')->group(function () {
    Route::get('/', [ContentController::class, 'index'])->defaults('type', 'event');
    Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'event');
    Route::get('/{eventId}/tickets', [PluginStorefrontController::class, 'eventTickets']);
    Route::post('/{eventId}/register', [PluginStorefrontController::class, 'eventRegister'])
        ->middleware('throttle:5,1');
});
