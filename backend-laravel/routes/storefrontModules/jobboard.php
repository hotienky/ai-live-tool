<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;
use App\Http\Controllers\Tenant\ContentController;

/*
|--------------------------------------------------------------------------
| Job Board Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:jobboard')->prefix('jobs')->group(function () {
    Route::get('/', [ContentController::class, 'index'])->defaults('type', 'job');
    Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'job');
    Route::post('/{jobId}/apply', [PluginStorefrontController::class, 'jobApply'])
        ->middleware('throttle:5,1');
});
