<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DomainController;

Route::prefix('domains')->group(function () {
    Route::get('/', [DomainController::class, 'index']);
    Route::post('/', [DomainController::class, 'store']);
    Route::post('/verify', [DomainController::class, 'verify']);
    Route::post('/primary', [DomainController::class, 'setPrimary']);
    Route::delete('/{domain}', [DomainController::class, 'destroy']);
});
