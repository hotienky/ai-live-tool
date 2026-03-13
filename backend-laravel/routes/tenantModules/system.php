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

// Dashboard
Route::get('/dashboard', [DashboardController::class, 'overview']);
Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
Route::get('/dashboard/recent-leads', [DashboardController::class, 'recentLeads']);
Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
Route::get('/dashboard/top-customers', [DashboardController::class, 'topCustomers']);
Route::get('/dashboard/order-stats', [DashboardController::class, 'orderStats']);

// Notifications
Route::get('/notifications', [NotificationsController::class, 'index']);
Route::get('/notifications/unread-count', [NotificationsController::class, 'unreadCount']);
Route::put('/notifications/{id}/read', [NotificationsController::class, 'markAsRead']);
Route::put('/notifications/read-all', [NotificationsController::class, 'markAllAsRead']);

// Webhooks
Route::get('/webhooks', [WebhooksController::class, 'index']);
Route::post('/webhooks', [WebhooksController::class, 'store']);
Route::put('/webhooks/{id}', [WebhooksController::class, 'update']);
Route::delete('/webhooks/{id}', [WebhooksController::class, 'destroy']);

// Activity Logs
Route::get('/activity-logs', [ActivityLogsController::class, 'index']);
Route::get('/activity-logs/stats', [ActivityLogsController::class, 'stats']);

// Roles & Permissions
Route::get('/roles', [RolesController::class, 'index']);
Route::get('/roles/permissions', [RolesController::class, 'permissions']);
Route::post('/roles', [RolesController::class, 'store']);
Route::get('/roles/{id}', [RolesController::class, 'show']);
Route::put('/roles/{id}', [RolesController::class, 'update']);
Route::delete('/roles/{id}', [RolesController::class, 'destroy']);
Route::get('/users', [RolesController::class, 'users']);
Route::put('/users/{id}/role', [RolesController::class, 'assignRole']);

// System Config
Route::get('/system-config', [SystemConfigController::class, 'index']);
Route::post('/system-config', [SystemConfigController::class, 'store']);
Route::get('/system-config/group/{group}', [SystemConfigController::class, 'showGroup']);
Route::put('/system-config/group/{group}', [SystemConfigController::class, 'updateGroup']);

// API Keys
Route::get('/api-keys', [ApiKeysController::class, 'index']);
Route::post('/api-keys', [ApiKeysController::class, 'store']);
Route::put('/api-keys/{id}', [ApiKeysController::class, 'update']);
Route::delete('/api-keys/{id}', [ApiKeysController::class, 'destroy']);

// Languages
Route::get('/languages', [LanguagesController::class, 'index']);
Route::post('/languages', [LanguagesController::class, 'store']);
Route::put('/languages/{id}', [LanguagesController::class, 'update']);
Route::delete('/languages/{id}', [LanguagesController::class, 'destroy']);
Route::get('/languages/{id}/translations', [LanguagesController::class, 'getTranslations']);
Route::put('/languages/{id}/translations', [LanguagesController::class, 'updateTranslations']);

// Custom Fields
Route::get('/custom-fields', [CustomFieldsController::class, 'index']);
Route::post('/custom-fields', [CustomFieldsController::class, 'store']);
Route::put('/custom-fields/{id}', [CustomFieldsController::class, 'update']);
Route::delete('/custom-fields/{id}', [CustomFieldsController::class, 'destroy']);
Route::get('/custom-fields/values/{entityType}/{entityId}', [CustomFieldsController::class, 'getValues']);
Route::put('/custom-fields/values/{entityType}/{entityId}', [CustomFieldsController::class, 'updateValues']);

// Flash Sales
Route::get('/flash-sales', [FlashSalesController::class, 'index']);
Route::get('/flash-sales/{id}', [FlashSalesController::class, 'show']);
Route::post('/flash-sales', [FlashSalesController::class, 'store']);
Route::put('/flash-sales/{id}', [FlashSalesController::class, 'update']);
Route::delete('/flash-sales/{id}', [FlashSalesController::class, 'destroy']);
