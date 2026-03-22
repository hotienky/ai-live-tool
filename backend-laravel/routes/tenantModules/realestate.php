<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ContentController;

// ════════════════════════════════════════════════════════════
// REAL ESTATE MODULE ROUTES — uses ContentTypeRegistry 'listing'
// ════════════════════════════════════════════════════════════
Route::middleware('module:realestate')->prefix('listings')->group(function () {
    Route::get('/',     [ContentController::class, 'index'])->defaults('type', 'listing');
    Route::post('/',    [ContentController::class, 'store'])->defaults('type', 'listing');
    Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'listing');
    Route::put('/{id}', [ContentController::class, 'update'])->defaults('type', 'listing');
    Route::delete('/{id}', [ContentController::class, 'destroy'])->defaults('type', 'listing');
});
