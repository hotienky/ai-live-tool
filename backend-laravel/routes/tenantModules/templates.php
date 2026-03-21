<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\TemplateStoreController;

Route::prefix('template-store')->group(function () {
    Route::get('/', [TemplateStoreController::class, 'index']);
    Route::get('/{id}', [TemplateStoreController::class, 'show']);
    Route::post('/{id}/install', [TemplateStoreController::class, 'install']);
    Route::post('/{id}/review', [TemplateStoreController::class, 'review']);
});
