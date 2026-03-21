<?php

use App\Http\Controllers\Tenant\CommentController;
use App\Http\Controllers\Tenant\BlogController;

/*
|--------------------------------------------------------------------------
| Blog Module — Storefront Public Routes (no auth)
|--------------------------------------------------------------------------
*/

Route::prefix('blog')->group(function () {
    Route::get('/rss', [BlogController::class, 'rss']);
    Route::get('/posts', [BlogController::class, 'posts']);
    Route::get('/posts/{slug}', [BlogController::class, 'showBySlug']);
    Route::post('/comments', [CommentController::class, 'store']);
    Route::get('/comments/{contentId}', [CommentController::class, 'forContent']);
});
