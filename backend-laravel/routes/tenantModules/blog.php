<?php

use App\Http\Controllers\Tenant\CommentController;

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Blog Module Routes — Admin (tenant-scoped + auth)
|--------------------------------------------------------------------------
| Storefront (public) routes are in storefrontModules/blog.php
*/

Route::middleware('module:blog')->group(function () {
    // ── Admin: Comment moderation ──
    Route::get('/comments', [CommentController::class, 'index']);
    Route::post('/comments/{id}/approve', [CommentController::class, 'approve']);
    Route::post('/comments/{id}/spam', [CommentController::class, 'spam']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);
});
