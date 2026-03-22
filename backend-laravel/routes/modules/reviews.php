<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ReviewController;

// Admin review management
Route::middleware(['module:reviews'])->group(function () {
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
    Route::put('/reviews/{id}/approve', [ReviewController::class, 'approve']);
    Route::get('/reviews/stats', [ReviewController::class, 'stats']);
});
