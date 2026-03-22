<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ContentController;
use App\Http\Controllers\Tenant\JobBoardController;

// ════════════════════════════════════════════════════════════
// JOB BOARD MODULE ROUTES — ContentType + Applications
// ════════════════════════════════════════════════════════════
Route::middleware('module:jobboard')->prefix('jobs')->group(function () {
    // Content CRUD (via ContentTypeRegistry)
    Route::get('/',     [ContentController::class, 'index'])->defaults('type', 'job');
    Route::post('/',    [ContentController::class, 'store'])->defaults('type', 'job');
    Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'job');
    Route::put('/{id}', [ContentController::class, 'update'])->defaults('type', 'job');
    Route::delete('/{id}', [ContentController::class, 'destroy'])->defaults('type', 'job');

    // Applications management
    Route::get('/{jobId}/applications', [JobBoardController::class, 'applications']);
    Route::get('/{jobId}/applications/{id}', [JobBoardController::class, 'showApplication']);
    Route::put('/{jobId}/applications/{id}', [JobBoardController::class, 'updateApplication']);
    Route::delete('/{jobId}/applications/{id}', [JobBoardController::class, 'destroyApplication']);
    Route::get('/{jobId}/stats', [JobBoardController::class, 'stats']);
});
