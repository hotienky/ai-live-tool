<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\FormSubmissionController;

Route::prefix('form-submissions')->group(function () {
    Route::get('/', [FormSubmissionController::class, 'index']);
    Route::get('/export', [FormSubmissionController::class, 'export']);
    Route::get('/{id}', [FormSubmissionController::class, 'show']);
    Route::delete('/{id}', [FormSubmissionController::class, 'destroy']);
});
