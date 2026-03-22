<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\FormController;

Route::middleware('module:forms')->group(function () {
    Route::get('/forms/{slug}', [FormController::class, 'showPublic']);
    Route::post('/forms/{slug}/submit', [FormController::class, 'submit'])
        ->middleware('throttle:10,1'); // Max 10 submissions per minute per IP
});
