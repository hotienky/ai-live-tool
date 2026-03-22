<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;
use App\Http\Controllers\Tenant\ContentController;

/*
|--------------------------------------------------------------------------
| Real Estate Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:realestate')->prefix('listings')->group(function () {
    Route::get('/', [ContentController::class, 'index'])->defaults('type', 'listing');
    Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'listing');
    Route::post('/{listingId}/inquiry', [PluginStorefrontController::class, 'listingInquiry'])
        ->middleware('throttle:5,1');
});
