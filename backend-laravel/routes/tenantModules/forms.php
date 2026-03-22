<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\FormController;
use App\Http\Controllers\Tenant\FormSubmissionController;

// Form Builder CRUD
Route::prefix('forms')->group(function () {
    Route::get('/', [FormController::class, 'index']);
    Route::post('/', [FormController::class, 'store']);
    Route::get('/{id}', [FormController::class, 'show']);
    Route::put('/{id}', [FormController::class, 'update']);
    Route::delete('/{id}', [FormController::class, 'destroy']);
    Route::get('/{formId}/submissions', [FormController::class, 'submissions']);
});

// Legacy form submissions (keep for backward compat)
Route::prefix('form-submissions')->group(function () {
    Route::get('/', [FormSubmissionController::class, 'index']);
    Route::get('/export', [FormSubmissionController::class, 'export']);
    Route::get('/{id}', [FormSubmissionController::class, 'show']);
    Route::put('/{id}/read', [FormController::class, 'markRead']);
    Route::delete('/{id}', [FormSubmissionController::class, 'destroy']);
});
