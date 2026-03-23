<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\ContentController;
use App\Http\Controllers\Tenant\EventController;

// ════════════════════════════════════════════════════════════
// EVENTS MODULE ROUTES — ContentType + dedicated controllers
// ════════════════════════════════════════════════════════════
Route::middleware('module:events')->prefix('events')->group(function () {
    // Global stats
    Route::get('/stats', [EventController::class, 'globalStats']);

    // Content CRUD (via ContentTypeRegistry)
    Route::get('/',     [ContentController::class, 'index'])->defaults('type', 'event');
    Route::post('/',    [ContentController::class, 'store'])->defaults('type', 'event');
    Route::get('/{id}', [ContentController::class, 'show'])->defaults('type', 'event');
    Route::put('/{id}', [ContentController::class, 'update'])->defaults('type', 'event');
    Route::delete('/{id}', [ContentController::class, 'destroy'])->defaults('type', 'event');

    // Tickets (nested under event)
    Route::get('/{eventId}/tickets', [EventController::class, 'tickets']);
    Route::post('/{eventId}/tickets', [EventController::class, 'storeTicket']);
    Route::put('/{eventId}/tickets/{id}', [EventController::class, 'updateTicket']);
    Route::delete('/{eventId}/tickets/{id}', [EventController::class, 'destroyTicket']);

    // Registrations / Attendees
    Route::get('/{eventId}/registrations', [EventController::class, 'registrations']);
    Route::post('/{eventId}/registrations/{id}/checkin', [EventController::class, 'checkIn']);
    Route::post('/{eventId}/registrations/{id}/check-in', [EventController::class, 'checkIn']); // alias with hyphen
    Route::delete('/{eventId}/registrations/{id}', [EventController::class, 'destroyRegistration']);
    Route::get('/{eventId}/stats', [EventController::class, 'registrationStats']);
});
