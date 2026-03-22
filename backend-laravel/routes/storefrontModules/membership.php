<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;

/*
|--------------------------------------------------------------------------
| Membership Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:membership')->prefix('membership')->group(function () {
    Route::get('/tiers', [PluginStorefrontController::class, 'membershipTiers']);
});
