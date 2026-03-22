<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\AiController;

Route::prefix('ai')->group(function () {
    Route::post('/generate', [AiController::class, 'generate']);
    Route::post('/batch-translate', [AiController::class, 'batchTranslate']);
    Route::get('/settings', [AiController::class, 'getSettings']);
    Route::put('/settings', [AiController::class, 'updateSettings']);
    Route::get('/usage', [AiController::class, 'getUsage']);
});
