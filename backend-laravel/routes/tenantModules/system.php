<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\NotificationsController;
use App\Http\Controllers\Tenant\WebhooksController;
use App\Http\Controllers\Tenant\ActivityLogsController;
use App\Http\Controllers\Tenant\RolesController;
use App\Http\Controllers\Tenant\SystemConfigController;
use App\Http\Controllers\Tenant\ApiKeysController;
use App\Http\Controllers\Tenant\LanguagesController;
use App\Http\Controllers\Tenant\CustomFieldsController;
use App\Http\Controllers\Tenant\FlashSalesController;
use App\Http\Controllers\Tenant\AuthController;
use App\Http\Controllers\Tenant\UserController;

// Dashboard (all authenticated users)
Route::get('/dashboard', [DashboardController::class, 'overview']);
Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
Route::get('/dashboard/recent-leads', [DashboardController::class, 'recentLeads']);
Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
Route::get('/dashboard/top-customers', [DashboardController::class, 'topCustomers']);
Route::get('/dashboard/order-stats', [DashboardController::class, 'orderStats']);

// Profile (own user)
Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
Route::put('/auth/change-password', [AuthController::class, 'changePassword']);

// Notifications (all authenticated users)
Route::get('/notifications', [NotificationsController::class, 'index']);
Route::get('/notifications/unread-count', [NotificationsController::class, 'unreadCount']);
Route::put('/notifications/{id}/read', [NotificationsController::class, 'markAsRead']);
Route::put('/notifications/read-all', [NotificationsController::class, 'markAllAsRead']);

// Webhooks
Route::get('/webhooks', [WebhooksController::class, 'index'])->middleware('permission:system.webhooks');
Route::post('/webhooks', [WebhooksController::class, 'store'])->middleware('permission:system.webhooks');
Route::put('/webhooks/{id}', [WebhooksController::class, 'update'])->middleware('permission:system.webhooks');
Route::delete('/webhooks/{id}', [WebhooksController::class, 'destroy'])->middleware('permission:system.webhooks');

// Activity Logs
Route::get('/activity-logs', [ActivityLogsController::class, 'index'])->middleware('permission:system.activity_logs');
Route::get('/activity-logs/stats', [ActivityLogsController::class, 'stats'])->middleware('permission:system.activity_logs');

// Roles & Permissions
Route::get('/roles', [RolesController::class, 'index'])->middleware('permission:system.roles');
Route::get('/roles/permissions', [RolesController::class, 'permissions'])->middleware('permission:system.roles');
Route::post('/roles', [RolesController::class, 'store'])->middleware('permission:system.roles');
Route::get('/roles/{id}', [RolesController::class, 'show'])->middleware('permission:system.roles');
Route::put('/roles/{id}', [RolesController::class, 'update'])->middleware('permission:system.roles');
Route::delete('/roles/{id}', [RolesController::class, 'destroy'])->middleware('permission:system.roles');
// User Management (staff accounts for tenant CMS)
Route::get('/users',                        [UserController::class, 'index'])       ->middleware('permission:system.users');
Route::post('/users',                       [UserController::class, 'store'])       ->middleware('permission:system.users');
Route::get('/users/{id}',                   [UserController::class, 'show'])        ->middleware('permission:system.users');
Route::put('/users/{id}',                   [UserController::class, 'update'])      ->middleware('permission:system.users');
Route::delete('/users/{id}',                [UserController::class, 'destroy'])     ->middleware('permission:system.users');
Route::patch('/users/{id}/toggle-active',   [UserController::class, 'toggleActive'])->middleware('permission:system.users');
Route::put('/users/{id}/role',              [UserController::class, 'update'])      ->middleware('permission:system.users'); // kept for backward compat

// System Config
Route::get('/system-config', [SystemConfigController::class, 'index'])->middleware('permission:settings.view');
Route::post('/system-config', [SystemConfigController::class, 'store'])->middleware('permission:settings.edit');
Route::get('/system-config/group/{group}', [SystemConfigController::class, 'showGroup'])->middleware('permission:settings.view');
Route::put('/system-config/group/{group}', [SystemConfigController::class, 'updateGroup'])->middleware('permission:settings.edit');

// API Keys
Route::get('/api-keys', [ApiKeysController::class, 'index'])->middleware('permission:system.api_keys');
Route::post('/api-keys', [ApiKeysController::class, 'store'])->middleware('permission:system.api_keys');
Route::put('/api-keys/{id}', [ApiKeysController::class, 'update'])->middleware('permission:system.api_keys');
Route::delete('/api-keys/{id}', [ApiKeysController::class, 'destroy'])->middleware('permission:system.api_keys');

// Languages
Route::get('/languages', [LanguagesController::class, 'index'])->middleware('permission:settings.view');
Route::post('/languages', [LanguagesController::class, 'store'])->middleware('permission:settings.edit');
Route::put('/languages/{id}', [LanguagesController::class, 'update'])->middleware('permission:settings.edit');
Route::delete('/languages/{id}', [LanguagesController::class, 'destroy'])->middleware('permission:settings.edit');
Route::get('/languages/{id}/translations', [LanguagesController::class, 'getTranslations'])->middleware('permission:settings.view');
Route::put('/languages/{id}/translations', [LanguagesController::class, 'updateTranslations'])->middleware('permission:settings.edit');

// Custom Fields
Route::get('/custom-fields', [CustomFieldsController::class, 'index'])->middleware('permission:settings.view');
Route::post('/custom-fields', [CustomFieldsController::class, 'store'])->middleware('permission:settings.edit');
Route::put('/custom-fields/{id}', [CustomFieldsController::class, 'update'])->middleware('permission:settings.edit');
Route::delete('/custom-fields/{id}', [CustomFieldsController::class, 'destroy'])->middleware('permission:settings.edit');
Route::get('/custom-fields/values/{entityType}/{entityId}', [CustomFieldsController::class, 'getValues'])->middleware('permission:settings.view');
Route::put('/custom-fields/values/{entityType}/{entityId}', [CustomFieldsController::class, 'updateValues'])->middleware('permission:settings.edit');

// Flash Sales
Route::get('/flash-sales', [FlashSalesController::class, 'index'])->middleware('permission:promotions.view');
Route::get('/flash-sales/{id}', [FlashSalesController::class, 'show'])->middleware('permission:promotions.view');
Route::post('/flash-sales', [FlashSalesController::class, 'store'])->middleware('permission:promotions.create');
Route::put('/flash-sales/{id}', [FlashSalesController::class, 'update'])->middleware('permission:promotions.edit');
Route::delete('/flash-sales/{id}', [FlashSalesController::class, 'destroy'])->middleware('permission:promotions.delete');
