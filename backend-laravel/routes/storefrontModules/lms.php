<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Storefront\PluginStorefrontController;

/*
|--------------------------------------------------------------------------
| LMS Module — Storefront Public Routes
|--------------------------------------------------------------------------
*/
Route::middleware('module:lms')->prefix('lms')->group(function () {
    Route::get('/courses', [PluginStorefrontController::class, 'lmsCourses']);
    Route::get('/courses/{slug}', [PluginStorefrontController::class, 'lmsCourseDetail']);
});
