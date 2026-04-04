<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\CmsPagesController;
use App\Http\Controllers\Tenant\BannersController;
use App\Http\Controllers\Tenant\NavLinksController;
use App\Http\Controllers\Tenant\NavigationMenuController;

// CMS Pages
Route::get('/cms-pages', [CmsPagesController::class, 'index'])->middleware('permission:cms.view');
Route::post('/cms-pages', [CmsPagesController::class, 'store'])->middleware('permission:cms.create');
// Static routes BEFORE {id} to avoid conflicts
Route::get('/cms-pages/system', [CmsPagesController::class, 'systemPages'])->middleware('permission:cms.view');
Route::get('/cms-pages/by-alias/{alias}', [CmsPagesController::class, 'showByAlias'])->middleware('permission:cms.view');
Route::get('/cms-pages/{id}', [CmsPagesController::class, 'show'])->middleware('permission:cms.view');
Route::put('/cms-pages/{id}', [CmsPagesController::class, 'update'])->middleware('permission:cms.edit');
Route::delete('/cms-pages/{id}', [CmsPagesController::class, 'destroy'])->middleware('permission:cms.delete');
Route::put('/cms-pages/{id}/layout', [CmsPagesController::class, 'saveLayout'])->middleware('permission:cms.edit');
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

// Navigation Menus (JSON Builder)
Route::get('/navigation-menus', [NavigationMenuController::class, 'index'])->middleware('permission:settings.view');
Route::post('/navigation-menus', [NavigationMenuController::class, 'store'])->middleware('permission:settings.edit');
Route::get('/navigation-menus/location/{location}', [NavigationMenuController::class, 'getByLocation'])->middleware('permission:settings.view');
Route::get('/navigation-menus/{id}', [NavigationMenuController::class, 'show'])->middleware('permission:settings.view');
Route::put('/navigation-menus/{id}', [NavigationMenuController::class, 'update'])->middleware('permission:settings.edit');
Route::delete('/navigation-menus/{id}', [NavigationMenuController::class, 'destroy'])->middleware('permission:settings.edit');

// Redirects
Route::get('/redirects', [\App\Http\Controllers\Tenant\RedirectsController::class, 'index'])->middleware('permission:settings.view');
Route::post('/redirects', [\App\Http\Controllers\Tenant\RedirectsController::class, 'store'])->middleware('permission:settings.edit');
Route::put('/redirects/{id}', [\App\Http\Controllers\Tenant\RedirectsController::class, 'update'])->middleware('permission:settings.edit');
Route::delete('/redirects/{id}', [\App\Http\Controllers\Tenant\RedirectsController::class, 'destroy'])->middleware('permission:settings.edit');

// Media Library
Route::get('/media', [\App\Http\Controllers\Tenant\MediaController::class, 'index'])->middleware('permission:media.view');
Route::post('/media/upload', [\App\Http\Controllers\Tenant\MediaController::class, 'upload'])->middleware('permission:media.upload');
Route::get('/media/{id}', [\App\Http\Controllers\Tenant\MediaController::class, 'show'])->middleware('permission:media.view');
Route::put('/media/{id}', [\App\Http\Controllers\Tenant\MediaController::class, 'update'])->middleware('permission:media.edit');
Route::delete('/media/{id}', [\App\Http\Controllers\Tenant\MediaController::class, 'destroy'])->middleware('permission:media.delete');

// ── Generic Content Type API ──
// Allows plugins to register content types (post, course, listing, etc.)
// and get full CRUD via a single controller.
use App\Http\Controllers\Tenant\ContentController;
use App\Http\Controllers\Tenant\TenantContentTypeController;

// Tenant's Custom Schema Builder API
Route::get('/tenant-content-types', [TenantContentTypeController::class, 'index'])->middleware('permission:settings.view');
Route::post('/tenant-content-types', [TenantContentTypeController::class, 'store'])->middleware('permission:settings.edit');
Route::get('/tenant-content-types/{id}', [TenantContentTypeController::class, 'show'])->middleware('permission:settings.view');
Route::put('/tenant-content-types/{id}', [TenantContentTypeController::class, 'update'])->middleware('permission:settings.edit');
Route::delete('/tenant-content-types/{id}', [TenantContentTypeController::class, 'destroy'])->middleware('permission:settings.edit');

Route::get('/content-types', [ContentController::class, 'types']);
Route::prefix('content/{type}')->group(function () {
    Route::get('/', [ContentController::class, 'index']);
    Route::post('/', [ContentController::class, 'store']);
    Route::get('/{id}', [ContentController::class, 'show']);
    Route::put('/{id}', [ContentController::class, 'update']);
    Route::delete('/{id}', [ContentController::class, 'destroy']);
});

