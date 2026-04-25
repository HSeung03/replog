<?php

namespace App\Http\Controllers;

use App\Models\WorkoutLog;
use App\Models\WorkoutSet;
use Illuminate\Http\Request;

class WorkoutLogController extends Controller
{
    // 날짜별 일지 조회 (세트 + 종목명 포함)
    public function show(Request $request, $date)
    {
        $log = WorkoutLog::with(['sets.exercise'])
            ->where('user_id', $request->user()->id)
            ->where('record_date', $date)
            ->first();

        if (!$log) {
            return response()->json(null, 204);
        }

        return response()->json($log);
    }

    // 월별 운동한 날짜 목록 (캘린더 표시용)
    public function calendar(Request $request)
    {
        $request->validate([
            'year'  => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $dates = WorkoutLog::where('user_id', $request->user()->id)
            ->whereYear('record_date', $request->year)
            ->whereMonth('record_date', $request->month)
            ->pluck('record_date');

        return response()->json($dates);
    }

    // 일지 생성 (날짜 + 메모)
    public function store(Request $request)
    {
        $request->validate([
            'record_date' => 'required|date',
            'memo'        => 'nullable|string',
        ]);

        $log = WorkoutLog::firstOrCreate(
            [
                'user_id'     => $request->user()->id,
                'record_date' => $request->record_date,
            ],
            ['memo' => $request->memo]
        );

        return response()->json($log, 201);
    }

    // 메모 수정
    public function update(Request $request, WorkoutLog $workoutLog)
    {
        if ($workoutLog->user_id != $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $request->validate(['memo' => 'nullable|string']);

        $workoutLog->update(['memo' => $request->memo]);

        return response()->json($workoutLog);
    }

    // 일지 삭제 (세트도 cascade로 자동 삭제)
    public function destroy(Request $request, WorkoutLog $workoutLog)
    {
        if ($workoutLog->user_id != $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $workoutLog->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }

    // 세트 추가
    public function addSet(Request $request, WorkoutLog $workoutLog)
    {
        if ($workoutLog->user_id != $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $request->validate([
            'exercise_id' => 'required|exists:exercises,id',
            'set_number'  => 'required|integer|min:1',
            'reps'        => 'required|integer|min:1',
            'weight'      => 'required|numeric|min:0',
        ]);

        $set = WorkoutSet::create([
            'workout_log_id' => $workoutLog->id,
            'exercise_id'    => $request->exercise_id,
            'set_number'     => $request->set_number,
            'reps'           => $request->reps,
            'weight'         => $request->weight,
        ]);

        return response()->json($set->load('exercise'), 201);
    }

    // 세트 수정
    public function updateSet(Request $request, WorkoutLog $workoutLog, WorkoutSet $set)
    {
        if ($workoutLog->user_id != $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $request->validate([
            'reps'   => 'required|integer|min:1',
            'weight' => 'required|numeric|min:0',
        ]);

        $set->update($request->only('reps', 'weight'));

        return response()->json($set->load('exercise'));
    }

    // 세트 삭제
    public function deleteSet(Request $request, WorkoutLog $workoutLog, WorkoutSet $set)
    {
        if ($workoutLog->user_id != $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $set->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
