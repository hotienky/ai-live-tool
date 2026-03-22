<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\MembershipController;

Route::middleware('module:membership')->group(function () {
    // Tiers
    Route::prefix('membership/tiers')->group(function () {
        Route::get('/',     [MembershipController::class, 'tiers']);
        Route::post('/',    [MembershipController::class, 'storeTier']);
        Route::get('/{id}', [MembershipController::class, 'showTier']);
        Route::put('/{id}', [MembershipController::class, 'updateTier']);
        Route::delete('/{id}', [MembershipController::class, 'destroyTier']);
    });

    // Members
    Route::prefix('membership/members')->group(function () {
        Route::get('/',     [MembershipController::class, 'members']);
        Route::post('/',    [MembershipController::class, 'storeMember']);
        Route::get('/{id}', [MembershipController::class, 'showMember']);
        Route::put('/{id}', [MembershipController::class, 'updateMember']);
        Route::delete('/{id}', [MembershipController::class, 'destroyMember']);
    });

    // Points transactions
    Route::get('/membership/transactions', [MembershipController::class, 'transactions']);
    Route::post('/membership/members/{id}/adjust-points', [MembershipController::class, 'adjustPoints']);

    // Earning rules
    Route::prefix('membership/rules')->group(function () {
        Route::get('/',     [MembershipController::class, 'rules']);
        Route::post('/',    [MembershipController::class, 'storeRule']);
        Route::put('/{id}', [MembershipController::class, 'updateRule']);
        Route::delete('/{id}', [MembershipController::class, 'destroyRule']);
    });

    // Dashboard stats
    Route::get('/membership/stats', [MembershipController::class, 'stats']);
});
