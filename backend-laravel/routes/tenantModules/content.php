<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\CmsPagesController;
use App\Http\Controllers\Tenant\BannersController;
use App\Http\Controllers\Tenant\NavLinksController;

// CMS Pages
Route::get('/cms-pages', [CmsPagesController::class, 'index'])->middleware('permission:cms.view');
Route::post('/cms-pages', [CmsPagesController::class, 'store'])->middleware('permission:cms.create');
Route::get('/cms-pages/{id}', [CmsPagesController::class, 'show'])->middleware('permission:cms.view');
Route::put('/cms-pages/{id}', [CmsPagesController::class, 'update'])->middleware('permission:cms.edit');
Route::delete('/cms-pages/{id}', [CmsPagesController::class, 'destroy'])->middleware('permission:cms.delete');
Route::post('/cms-pages/{id}/publish', [CmsPagesController::class, 'publish'])->middleware('permission:cms.edit');
Route::post('/cms-pages/{id}/unpublish', [CmsPagesController::class, 'unpublish'])->middleware('permission:cms.edit');
Route::post('/cms-pages/{id}/schedule', [CmsPagesController::class, 'schedule'])->middleware('permission:cms.edit');

// Banners
Route::get('/banners', [BannersController::class, 'index'])->middleware('permission:banners.view');
Route::get('/banners/{id}', [BannersController::class, 'show'])->middleware('permission:banners.view');
Route::post('/banners', [BannersController::class, 'store'])->middleware('permission:banners.create');
Route::put('/banners/{id}', [BannersController::class, 'update'])->middleware('permission:banners.edit');
Route::delete('/banners/{id}', [BannersController::class, 'destroy'])->middleware('permission:banners.delete');

// Nav Links
Route::get('/nav-links', [NavLinksController::class, 'index'])->middleware('permission:settings.view');
Route::get('/nav-links/flat', [NavLinksController::class, 'flat'])->middleware('permission:settings.view');
Route::post('/nav-links', [NavLinksController::class, 'store'])->middleware('permission:settings.edit');
Route::put('/nav-links/{id}', [NavLinksController::class, 'update'])->middleware('permission:settings.edit');
Route::delete('/nav-links/{id}', [NavLinksController::class, 'destroy'])->middleware('permission:settings.edit');
Route::post('/nav-links/reorder', [NavLinksController::class, 'reorder'])->middleware('permission:settings.edit');

// Redirects
Route::get('/redirects', [\App\Http\Controllers\Tenant\RedirectsController::class, 'index'])->middleware('permission:settings.view');
Route::post('/redirects', [\App\Http\Controllers\Tenant\RedirectsController::class, 'store'])->middleware('permission:settings.edit');
Route::put('/redirects/{id}', [\App\Http\Controllers\Tenant\RedirectsController::class, 'update'])->middleware('permission:settings.edit');
Route::delete('/redirects/{id}', [\App\Http\Controllers\Tenant\RedirectsController::class, 'destroy'])->middleware('permission:settings.edit');
