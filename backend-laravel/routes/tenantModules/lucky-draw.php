<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\LuckyDrawController;

Route::middleware('module:lucky-draw')->group(function () {
    Route::prefix('lucky-draw')->group(function () {
        Route::get('/',     [LuckyDrawController::class, 'index']);
        Route::post('/',    [LuckyDrawController::class, 'store']);
        Route::get('/{id}', [LuckyDrawController::class, 'show']);
        Route::put('/{id}', [LuckyDrawController::class, 'update']);
        Route::delete('/{id}', [LuckyDrawController::class, 'destroy']);

        // Prizes (nested)
        Route::get('/{wheelId}/prizes', [LuckyDrawController::class, 'prizes']);
        Route::post('/{wheelId}/prizes', [LuckyDrawController::class, 'storePrize']);
        Route::put('/{wheelId}/prizes/{id}', [LuckyDrawController::class, 'updatePrize']);
        Route::delete('/{wheelId}/prizes/{id}', [LuckyDrawController::class, 'destroyPrize']);

        // Spin history
        Route::get('/{wheelId}/spins', [LuckyDrawController::class, 'spins']);
    });
});
