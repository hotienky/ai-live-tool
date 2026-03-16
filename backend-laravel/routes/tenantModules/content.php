<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\CmsPagesController;
use App\Http\Controllers\Tenant\BannersController;
use App\Http\Controllers\Tenant\NavLinksController;

// CMS Pages
Route::get('/cms-pages', [CmsPagesController::class, 'index']);
Route::post('/cms-pages', [CmsPagesController::class, 'store']);
Route::get('/cms-pages/{id}', [CmsPagesController::class, 'show']);
Route::put('/cms-pages/{id}', [CmsPagesController::class, 'update']);
Route::delete('/cms-pages/{id}', [CmsPagesController::class, 'destroy']);
Route::post('/cms-pages/{id}/publish', [CmsPagesController::class, 'publish']);
Route::post('/cms-pages/{id}/unpublish', [CmsPagesController::class, 'unpublish']);
Route::post('/cms-pages/{id}/schedule', [CmsPagesController::class, 'schedule']);

// Banners
Route::get('/banners', [BannersController::class, 'index']);
Route::get('/banners/{id}', [BannersController::class, 'show']);
Route::post('/banners', [BannersController::class, 'store']);
Route::put('/banners/{id}', [BannersController::class, 'update']);
Route::delete('/banners/{id}', [BannersController::class, 'destroy']);

// Nav Links
Route::get('/nav-links', [NavLinksController::class, 'index']);
Route::get('/nav-links/flat', [NavLinksController::class, 'flat']);
Route::post('/nav-links', [NavLinksController::class, 'store']);
Route::put('/nav-links/{id}', [NavLinksController::class, 'update']);
Route::delete('/nav-links/{id}', [NavLinksController::class, 'destroy']);
Route::post('/nav-links/reorder', [NavLinksController::class, 'reorder']);

// Redirects
Route::get('/redirects', [\App\Http\Controllers\Tenant\RedirectsController::class, 'index']);
Route::post('/redirects', [\App\Http\Controllers\Tenant\RedirectsController::class, 'store']);
Route::put('/redirects/{id}', [\App\Http\Controllers\Tenant\RedirectsController::class, 'update']);
Route::delete('/redirects/{id}', [\App\Http\Controllers\Tenant\RedirectsController::class, 'destroy']);

