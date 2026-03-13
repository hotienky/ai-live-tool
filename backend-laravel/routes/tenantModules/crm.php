<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\LeadsController;
use App\Http\Controllers\Tenant\CustomersController;
use App\Http\Controllers\Tenant\SessionsController;

// Leads
Route::get('/leads', [LeadsController::class, 'index']);
Route::get('/leads/stats', [LeadsController::class, 'pipelineStats']);
Route::get('/leads/pipeline-stats', [LeadsController::class, 'pipelineStats']);
Route::get('/leads/{id}', [LeadsController::class, 'show']);
Route::put('/leads/{id}', [LeadsController::class, 'update']);
Route::delete('/leads/{id}', [LeadsController::class, 'destroy']);
Route::get('/leads-pipeline', [LeadsController::class, 'pipelineStats']);

// Customers
Route::get('/customers', [CustomersController::class, 'index']);
Route::get('/customers/{id}', [CustomersController::class, 'show']);
Route::put('/customers/{id}', [CustomersController::class, 'update']);
Route::delete('/customers/{id}', [CustomersController::class, 'destroy']);

// Sessions
Route::get('/sessions', [SessionsController::class, 'index']);
Route::get('/sessions/{id}', [SessionsController::class, 'show']);
