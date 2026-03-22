<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;

/*
|--------------------------------------------------------------------------
| Lucky Draw Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:lucky-draw')->prefix('lucky-draw')->group(function () {
    Route::get('/{id}', [PluginStorefrontController::class, 'luckyDrawShow']);
    Route::post('/{id}/spin', [PluginStorefrontController::class, 'luckyDrawSpin'])
        ->middleware('throttle:20,1'); // max 20 spins per minute
});
