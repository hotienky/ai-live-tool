<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\FormSubmissionController;

Route::middleware('module:forms')->group(function () {
    Route::post('/forms/submit', [FormSubmissionController::class, 'store']);
});
