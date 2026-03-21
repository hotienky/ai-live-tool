<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\FormSubmissionController;

Route::post('/forms/submit', [FormSubmissionController::class, 'store']);
