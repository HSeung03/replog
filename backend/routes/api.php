<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BodyRecordController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\WorkoutLogController;
use App\Http\Controllers\WorkoutTemplateController;
use Illuminate\Support\Facades\Route;

// 인증 불필요
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::middleware('web')->group(function () {
    Route::get('/auth/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);
});

// 인증 필요
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // 운동 종목
    Route::get('/exercises',               [ExerciseController::class, 'index']);
    Route::post('/exercises',              [ExerciseController::class, 'store']);
    Route::delete('/exercises/{exercise}', [ExerciseController::class, 'destroy']);

    // 운동 일지
    Route::get('/workout-logs/calendar',          [WorkoutLogController::class, 'calendar']);
    Route::get('/workout-logs/{date}',             [WorkoutLogController::class, 'show']);
    Route::post('/workout-logs',                   [WorkoutLogController::class, 'store']);
    Route::patch('/workout-logs/{workoutLog}',     [WorkoutLogController::class, 'update']);
    Route::delete('/workout-logs/{workoutLog}',    [WorkoutLogController::class, 'destroy']);

    // 세트
    Route::post('/workout-logs/{workoutLog}/sets',             [WorkoutLogController::class, 'addSet']);
    Route::patch('/workout-logs/{workoutLog}/sets/{set}',      [WorkoutLogController::class, 'updateSet']);
    Route::delete('/workout-logs/{workoutLog}/sets/{set}',     [WorkoutLogController::class, 'deleteSet']);

    // 템플릿
    Route::get('/templates',                      [WorkoutTemplateController::class, 'index']);
    Route::post('/templates',                     [WorkoutTemplateController::class, 'store']);
    Route::get('/templates/{workoutTemplate}',    [WorkoutTemplateController::class, 'show']);
    Route::patch('/templates/{workoutTemplate}',  [WorkoutTemplateController::class, 'update']);
    Route::delete('/templates/{workoutTemplate}', [WorkoutTemplateController::class, 'destroy']);

    // 신체 기록
    Route::get('/body-records',                [BodyRecordController::class, 'index']);
    Route::post('/body-records',               [BodyRecordController::class, 'store']);
    Route::patch('/body-records/{bodyRecord}', [BodyRecordController::class, 'update']);
    Route::delete('/body-records/{bodyRecord}', [BodyRecordController::class, 'destroy']);
});
