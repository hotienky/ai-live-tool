<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\BillingController;

Route::prefix('billing')->group(function () {
    Route::get('/plans', [BillingController::class, 'getPlans']);
    Route::get('/current-plan', [BillingController::class, 'currentPlan']);
    Route::get('/usage', [BillingController::class, 'usage']);
    Route::post('/change-plan', [BillingController::class, 'changePlan']);
    Route::get('/invoices', [BillingController::class, 'invoices']);
});
