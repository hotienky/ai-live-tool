<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Master\AiConfigController;

Route::prefix('ai-config')->group(function () {
    Route::get('/', [AiConfigController::class, 'getConfig']);
    Route::put('/', [AiConfigController::class, 'updateConfig']);
    Route::get('/usage', [AiConfigController::class, 'getAllUsage']);
    Route::get('/usage/{tenantId}', [AiConfigController::class, 'getTenantUsage']);
    
    // Manage tenant-specific config from master
    Route::get('/tenant/{tenantId}/settings', [AiConfigController::class, 'getTenantSettings']);
    Route::put('/tenant/{tenantId}/settings', [AiConfigController::class, 'updateTenantSettings']);
});
