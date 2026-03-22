<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ContentController;

/*
|--------------------------------------------------------------------------
| Forum Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:forum')->prefix('forum')->group(function () {
    Route::get('/topics', [ContentController::class, 'index'])->defaults('type', 'topic');
    Route::get('/topics/{id}', [ContentController::class, 'show'])->defaults('type', 'topic');
});
