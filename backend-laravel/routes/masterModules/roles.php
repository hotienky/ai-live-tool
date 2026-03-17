<?php
use App\Http\Controllers\Master\MasterRolesController;

Route::get('/roles', [MasterRolesController::class, 'index']);
Route::post('/roles', [MasterRolesController::class, 'store']);
Route::put('/roles/{id}', [MasterRolesController::class, 'update']);
Route::delete('/roles/{id}', [MasterRolesController::class, 'destroy']);
