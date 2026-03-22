<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ReviewController;

// Admin review management
Route::prefix('reviews')->group(function () {
    Route::get('/', [ReviewController::class, 'index']);
    Route::get('/stats', [ReviewController::class, 'stats']);
    Route::post('/', [ReviewController::class, 'store']);
    Route::put('/{id}', [ReviewController::class, 'update']);
    Route::put('/{id}/approve', [ReviewController::class, 'approve']);
    Route::delete('/{id}', [ReviewController::class, 'destroy']);
});
