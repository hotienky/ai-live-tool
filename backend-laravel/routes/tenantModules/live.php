<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ShopsController;
use App\Http\Controllers\Tenant\KeywordsController;
use App\Http\Controllers\Tenant\TemplatesController;
use App\Http\Controllers\Tenant\ExportController;
use App\Http\Controllers\Tenant\AuthController;

Route::middleware('module:livestream')->group(function () {
    // Shops
    Route::get('/shops', [ShopsController::class, 'index']);
    Route::post('/shops', [ShopsController::class, 'store']);
    Route::post('/shops/find-or-create', [ShopsController::class, 'findOrCreate']);
    Route::get('/shops/{id}', [ShopsController::class, 'show']);
    Route::put('/shops/{id}', [ShopsController::class, 'update']);
    Route::delete('/shops/{id}', [ShopsController::class, 'destroy']);
    Route::post('/shops/{id}/connect', [ShopsController::class, 'connect']);
    Route::post('/shops/{id}/disconnect', [ShopsController::class, 'disconnect']);

    // Keywords
    Route::get('/keywords', [KeywordsController::class, 'index']);
    Route::post('/keywords', [KeywordsController::class, 'store']);
    Route::delete('/keywords/{id}', [KeywordsController::class, 'destroy']);

    // Auto-Reply Templates
    Route::get('/templates', [TemplatesController::class, 'index']);
    Route::get('/templates/{id}', [TemplatesController::class, 'show']);
    Route::post('/templates', [TemplatesController::class, 'store']);
    Route::put('/templates/{id}', [TemplatesController::class, 'update']);
    Route::delete('/templates/{id}', [TemplatesController::class, 'destroy']);

    // Export
    Route::get('/export/leads', [ExportController::class, 'leads']);
    Route::get('/export/comments', [ExportController::class, 'comments']);
    Route::get('/export/customers', [ExportController::class, 'customers']);
    Route::get('/export/report', [ExportController::class, 'report']);

    // Profile & Password
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);
});
