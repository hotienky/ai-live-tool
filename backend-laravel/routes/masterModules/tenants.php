<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Master\MasterAuthController;
use App\Http\Controllers\Master\TenantsController;
use App\Http\Controllers\Master\DomainController;

// Auth (protected)
Route::get('/auth/me', [MasterAuthController::class, 'me']);
Route::post('/auth/logout', [MasterAuthController::class, 'logout']);

// Tenant CRUD
Route::get('/tenants', [TenantsController::class, 'index']);
Route::get('/tenants/{id}', [TenantsController::class, 'show']);
Route::post('/tenants', [TenantsController::class, 'store']);
Route::put('/tenants/{id}', [TenantsController::class, 'update']);
Route::delete('/tenants/{id}', [TenantsController::class, 'destroy']);

// Tenant lifecycle
Route::post('/tenants/{id}/suspend', [TenantsController::class, 'suspend']);
Route::post('/tenants/{id}/activate', [TenantsController::class, 'activate']);
Route::post('/tenants/{id}/migrate', [TenantsController::class, 'migrate']);
Route::post('/tenants/{id}/seed', [TenantsController::class, 'seed']);

// Tenant custom domains
Route::get('/tenants/{id}/domains', [DomainController::class, 'index']);
Route::post('/tenants/{id}/domains', [DomainController::class, 'store']);
Route::delete('/tenants/{id}/domains/{domainId}', [DomainController::class, 'destroy']);
