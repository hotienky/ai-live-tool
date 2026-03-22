<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\AiController;

Route::prefix('ai')->group(function () {
    Route::post('/generate', [AiController::class, 'generate']);
    Route::post('/batch-translate', [AiController::class, 'batchTranslate']);
});
