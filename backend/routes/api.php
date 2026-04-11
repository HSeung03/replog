<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExerciseController;
use Illuminate\Support\Facades\Route;

// 인증 불필요
Route::middleware('web')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// 인증 필요
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // 운동 종목
    Route::get('/exercises',          [ExerciseController::class, 'index']);
    Route::post('/exercises',         [ExerciseController::class, 'store']);
    Route::delete('/exercises/{exercise}', [ExerciseController::class, 'destroy']);
});
