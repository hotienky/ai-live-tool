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

// Banners
Route::get('/banners', [BannersController::class, 'index']);
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
