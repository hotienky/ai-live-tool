<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ForumController;

Route::middleware('module:forum')->prefix('forum')->group(function () {
    Route::get('/stats', [ForumController::class, 'stats']);

    // Categories
    Route::get('/categories',        [ForumController::class, 'categories']);
    Route::post('/categories',       [ForumController::class, 'storeCategory']);
    Route::put('/categories/{id}',   [ForumController::class, 'updateCategory']);
    Route::delete('/categories/{id}',[ForumController::class, 'destroyCategory']);

    // Threads
    Route::get('/threads',           [ForumController::class, 'threads']);
    Route::put('/threads/{id}',      [ForumController::class, 'updateThread']);
    Route::delete('/threads/{id}',   [ForumController::class, 'destroyThread']);
});
