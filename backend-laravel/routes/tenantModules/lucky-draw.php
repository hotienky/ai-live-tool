<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\LuckyDrawController;

Route::middleware('module:lucky-draw')->group(function () {
    Route::prefix('lucky-draw')->group(function () {
        // ── Stats Dashboard ──
        Route::get('/stats', [LuckyDrawController::class, 'stats']);

        // ── Campaigns (= Wheels) CRUD ──
        // Frontend bundle uses /lucky-draw/campaigns as the resource URL
        Route::get('/campaigns',     [LuckyDrawController::class, 'index']);
        Route::post('/campaigns',    [LuckyDrawController::class, 'store']);
        Route::get('/campaigns/{id}', [LuckyDrawController::class, 'show']);
        Route::put('/campaigns/{id}', [LuckyDrawController::class, 'update']);
        Route::delete('/campaigns/{id}', [LuckyDrawController::class, 'destroy']);

        // Prizes (nested under campaign)
        Route::get('/campaigns/{campaignId}/prizes', [LuckyDrawController::class, 'prizes']);
        Route::post('/campaigns/{campaignId}/prizes', [LuckyDrawController::class, 'storePrize']);
        Route::put('/campaigns/{campaignId}/prizes/{id}', [LuckyDrawController::class, 'updatePrize']);
        Route::delete('/campaigns/{campaignId}/prizes/{id}', [LuckyDrawController::class, 'destroyPrize']);

        // Draw execution
        Route::post('/campaigns/{campaignId}/draw', [LuckyDrawController::class, 'draw']);

        // Spin history
        Route::get('/campaigns/{campaignId}/spins', [LuckyDrawController::class, 'spins']);

        // ── Legacy routes (keep backward compat) ──
        Route::get('/',     [LuckyDrawController::class, 'index']);
        Route::post('/',    [LuckyDrawController::class, 'store']);
        Route::get('/{id}', [LuckyDrawController::class, 'show'])->where('id', '[0-9]+');
        Route::put('/{id}', [LuckyDrawController::class, 'update'])->where('id', '[0-9]+');
        Route::delete('/{id}', [LuckyDrawController::class, 'destroy'])->where('id', '[0-9]+');
        Route::get('/{wheelId}/prizes', [LuckyDrawController::class, 'prizes'])->where('wheelId', '[0-9]+');
        Route::post('/{wheelId}/prizes', [LuckyDrawController::class, 'storePrize'])->where('wheelId', '[0-9]+');
        Route::put('/{wheelId}/prizes/{id}', [LuckyDrawController::class, 'updatePrize'])->where('wheelId', '[0-9]+');
        Route::delete('/{wheelId}/prizes/{id}', [LuckyDrawController::class, 'destroyPrize'])->where('wheelId', '[0-9]+');
        Route::get('/{wheelId}/spins', [LuckyDrawController::class, 'spins'])->where('wheelId', '[0-9]+');
    });
});
