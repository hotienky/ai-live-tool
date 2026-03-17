<?php
use App\Http\Controllers\Master\MasterUsersController;

Route::get('/users', [MasterUsersController::class, 'index']);
Route::post('/users', [MasterUsersController::class, 'store']);
Route::put('/users/{id}', [MasterUsersController::class, 'update']);
Route::delete('/users/{id}', [MasterUsersController::class, 'destroy']);
