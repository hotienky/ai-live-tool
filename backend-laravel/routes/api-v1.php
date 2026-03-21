<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InitializeTenancyBySlug;
use App\Http\Middleware\ApiKeyAuth;
use App\Http\Middleware\ApiSecretKeyOnly;
use App\Http\Controllers\Api\V1\SiteController;
use App\Http\Controllers\Api\V1\ContentApiController;
use App\Http\Controllers\Api\V1\TaxonomyController;
use App\Http\Controllers\Api\V1\MediaApiController;
use App\Http\Controllers\Api\V1\MenuController;
use App\Http\Controllers\Api\V1\SearchController;

/*
|--------------------------------------------------------------------------
| Public REST API v1
|--------------------------------------------------------------------------
|
| Versioned, rate-limited public API for headless CMS mode.
| Authentication: X-API-Key header (pk_* for reads, sk_* for writes)
|
| Endpoints:
|   GET  /api/v1/site              — Site config
|   GET  /api/v1/content/{type}    — List content (filterable, sortable)
|   GET  /api/v1/content/{type}/{slug} — Single by slug
|   POST /api/v1/content/{type}    — Create (sk_ key)
|   PUT  /api/v1/content/{type}/{id} — Update (sk_ key)
|   DELETE /api/v1/content/{type}/{id} — Delete (sk_ key)
|   GET  /api/v1/taxonomies/{type} — Taxonomy terms
|   GET  /api/v1/media/{id}        — Media info
|   POST /api/v1/media             — Upload (sk_ key)
|   GET  /api/v1/menus             — List menu locations
|   GET  /api/v1/menus/{location}  — Menu tree
|   GET  /api/v1/search?q=         — Full-text search
*/

Route::prefix('v1')->middleware([InitializeTenancyBySlug::class, ApiKeyAuth::class])->group(function () {
    // ── Site Config ──
    Route::get('site', [SiteController::class, 'index']);

    // ── Content (read-only with pk_ key) ──
    Route::get('content/{type}', [ContentApiController::class, 'index']);
    Route::get('content/{type}/{slug}', [ContentApiController::class, 'show']);

    // ── Taxonomies ──
    Route::get('taxonomies/{type}', [TaxonomyController::class, 'index']);

    // ── Media (read) ──
    Route::get('media/{id}', [MediaApiController::class, 'show']);

    // ── Menus ──
    Route::get('menus', [MenuController::class, 'index']);
    Route::get('menus/{location}', [MenuController::class, 'show']);

    // ── Search ──
    Route::get('search', [SearchController::class, 'search']);

    // ── Write operations (sk_ secret key required) ──
    Route::middleware([ApiSecretKeyOnly::class])->group(function () {
        Route::post('content/{type}', [ContentApiController::class, 'store']);
        Route::put('content/{type}/{id}', [ContentApiController::class, 'update']);
        Route::delete('content/{type}/{id}', [ContentApiController::class, 'destroy']);
        Route::post('media', [MediaApiController::class, 'upload']);
    });
});
