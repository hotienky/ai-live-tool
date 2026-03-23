<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ContentController;
use App\Http\Controllers\Tenant\RealEstateController;

Route::middleware('module:realestate')->prefix('realestate')->group(function () {
    // Properties (Content-based with type=listing)
    Route::get('/properties',         [ContentController::class, 'index'])->defaults('type', 'listing');
    Route::post('/properties',        [ContentController::class, 'store'])->defaults('type', 'listing');
    Route::get('/properties/{id}',    [ContentController::class, 'show'])->defaults('type', 'listing');
    Route::put('/properties/{id}',    [ContentController::class, 'update'])->defaults('type', 'listing');
    Route::delete('/properties/{id}', [ContentController::class, 'destroy'])->defaults('type', 'listing');

    // Inquiries
    Route::get('/inquiries',          [RealEstateController::class, 'inquiries']);
    Route::get('/inquiries/{id}',     [RealEstateController::class, 'showInquiry']);
    Route::put('/inquiries/{id}',     [RealEstateController::class, 'updateInquiry']);
    Route::delete('/inquiries/{id}',  [RealEstateController::class, 'destroyInquiry']);

    // Stats
    Route::get('/stats', [RealEstateController::class, 'stats']);
});
