<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ContentController;
use App\Http\Controllers\Tenant\JobBoardController;

// ════════════════════════════════════════════════════════════
// JOB BOARD MODULE ROUTES — ContentType + Applications
// ════════════════════════════════════════════════════════════
Route::middleware('module:jobboard')->group(function () {
    // ── Frontend bundle uses /jobboard/jobs and /jobboard/applications ──
    Route::prefix('jobboard/jobs')->group(function () {
        Route::get('/',     [ContentController::class, 'index'])->defaults('type', 'job');
        Route::post('/',    [ContentController::class, 'store'])->defaults('type', 'job');
        Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'job');
        Route::put('/{id}', [ContentController::class, 'update'])->defaults('type', 'job');
        Route::delete('/{id}', [ContentController::class, 'destroy'])->defaults('type', 'job');
    });

    // Applications under /jobboard/applications
    Route::get('/jobboard/applications', [JobBoardController::class, 'allApplications']);
    Route::get('/jobboard/applications/{id}', [JobBoardController::class, 'showApplication']);
    Route::put('/jobboard/applications/{id}', [JobBoardController::class, 'updateApplication']);

    // Stats
    Route::get('/jobboard/stats', [JobBoardController::class, 'stats']);

    // ── Legacy routes under /jobs/ prefix ──
    Route::prefix('jobs')->group(function () {
        Route::get('/',     [ContentController::class, 'index'])->defaults('type', 'job');
        Route::post('/',    [ContentController::class, 'store'])->defaults('type', 'job');
        Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'job');
        Route::put('/{id}', [ContentController::class, 'update'])->defaults('type', 'job');
        Route::delete('/{id}', [ContentController::class, 'destroy'])->defaults('type', 'job');

        Route::get('/{jobId}/applications', [JobBoardController::class, 'applications']);
        Route::get('/{jobId}/applications/{id}', [JobBoardController::class, 'showApplication']);
        Route::put('/{jobId}/applications/{id}', [JobBoardController::class, 'updateApplication']);
        Route::delete('/{jobId}/applications/{id}', [JobBoardController::class, 'destroyApplication']);
        Route::get('/{jobId}/stats', [JobBoardController::class, 'stats']);
    });
});

