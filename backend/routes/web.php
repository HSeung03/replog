<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/api/auth/google/redirect', [AuthController::class, 'googleRedirect']);
Route::get('/api/auth/google/callback', [AuthController::class, 'googleCallback']);
