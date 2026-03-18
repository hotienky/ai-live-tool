<?php

// Master admin module management routes
use App\Http\Controllers\Master\ModuleAdminController;

Route::prefix('modules')->group(function () {
    Route::get('/', [ModuleAdminController::class, 'index']);
    Route::post('/', [ModuleAdminController::class, 'store']);
    Route::put('/{id}', [ModuleAdminController::class, 'update']);
    Route::delete('/{id}', [ModuleAdminController::class, 'destroy']);
    Route::patch('/{id}/toggle', [ModuleAdminController::class, 'toggle']);

    // Module request management
    Route::get('/requests', [ModuleAdminController::class, 'pendingRequests']);
    Route::patch('/requests/{id}/approve', [ModuleAdminController::class, 'approve']);
    Route::patch('/requests/{id}/reject', [ModuleAdminController::class, 'reject']);
});
