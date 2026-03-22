<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ContentController;

// ════════════════════════════════════════════════════════════
// FORUM MODULE ROUTES — uses ContentTypeRegistry 'topic'
// ════════════════════════════════════════════════════════════
Route::middleware('module:forum')->prefix('forum')->group(function () {
    Route::get('/topics',     [ContentController::class, 'index'])->defaults('type', 'topic');
    Route::post('/topics',    [ContentController::class, 'store'])->defaults('type', 'topic');
    Route::get('/topics/{id}', [ContentController::class, 'show'])->defaults('type', 'topic');
    Route::put('/topics/{id}', [ContentController::class, 'update'])->defaults('type', 'topic');
    Route::delete('/topics/{id}', [ContentController::class, 'destroy'])->defaults('type', 'topic');
});
