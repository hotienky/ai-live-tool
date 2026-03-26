<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OnboardingController;

Route::prefix('onboarding')->group(function () {
    Route::get('/industries', [OnboardingController::class, 'getIndustries']);
    Route::get('/templates', [OnboardingController::class, 'getTemplates']);
    Route::post('/apply', [OnboardingController::class, 'applyTemplate']);
});
