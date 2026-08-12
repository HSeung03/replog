<?php

namespace App\Http\Controllers;

use App\Models\WorkoutLog;
use App\Models\WorkoutSet;
use Illuminate\Http\Request;

class WorkoutLogController extends Controller
{
    /*
     * workout_sets 컬럼이 담을 수 있는 상한.
     * 검증이 이보다 넓으면 MySQL strict 모드에서 범위 초과(22003)로 500이 난다.
     * sqlite는 이 제약을 강제하지 않아 로컬 테스트로는 드러나지 않는다.
     */
    private const MAX_SET_NUMBER = 255;     // unsignedTinyInteger
    private const MAX_REPS       = 65535;   // unsignedSmallInteger
    private const MAX_WEIGHT     = 999.99;  // decimal(5, 2)

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
            'set_number'  => 'required|integer|min:1|max:'.self::MAX_SET_NUMBER,
            'reps'        => 'required|integer|min:1|max:'.self::MAX_REPS,
            'weight'      => 'required|numeric|min:0|max:'.self::MAX_WEIGHT,
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

        // 세트가 이 일지에 속하는지 확인 (다른 일지의 세트 ID를 끼워넣는 것 차단)
        if ($set->workout_log_id != $workoutLog->id) {
            return response()->json(['message' => '세트를 찾을 수 없습니다.'], 404);
        }

        $request->validate([
            'reps'   => 'required|integer|min:1|max:'.self::MAX_REPS,
            'weight' => 'required|numeric|min:0|max:'.self::MAX_WEIGHT,
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

        // 세트가 이 일지에 속하는지 확인 (다른 일지의 세트 ID를 끼워넣는 것 차단)
        if ($set->workout_log_id != $workoutLog->id) {
            return response()->json(['message' => '세트를 찾을 수 없습니다.'], 404);
        }

        $exerciseId = $set->exercise_id;
        $set->delete();

        WorkoutSet::where('workout_log_id', $workoutLog->id)
            ->where('exercise_id', $exerciseId)
            ->orderBy('set_number')
            ->get()
            ->each(function ($s, $index) {
                $s->update(['set_number' => $index + 1]);
            });

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
