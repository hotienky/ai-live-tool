<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Master\MasterAuthController;

Route::post('/login', [MasterAuthController::class, 'login']);
