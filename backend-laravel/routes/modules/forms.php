<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\FormController;

// Admin CRUD
Route::middleware(['module:forms'])->group(function () {
    Route::get('/forms', [FormController::class, 'index']);
    Route::post('/forms', [FormController::class, 'store']);
    Route::get('/forms/{id}', [FormController::class, 'show']);
    Route::put('/forms/{id}', [FormController::class, 'update']);
    Route::delete('/forms/{id}', [FormController::class, 'destroy']);
    Route::get('/forms/{formId}/submissions', [FormController::class, 'submissions']);
    Route::put('/form-submissions/{id}/read', [FormController::class, 'markRead']);
    Route::delete('/form-submissions/{id}', [FormController::class, 'deleteSubmission']);
});
