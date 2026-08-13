<?php

namespace App\Http\Controllers;

use App\Http\Resources\WorkoutLogResource;
use App\Http\Resources\WorkoutSetResource;
use App\Models\Exercise;
use App\Models\WorkoutLog;
use App\Models\WorkoutSet;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        return response()->json(WorkoutLogResource::make($log));
    }

    // 월별 운동한 날짜 목록 (캘린더 표시용)
    public function calendar(Request $request)
    {
        $request->validate([
            'year'  => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        // whereYear/whereMonth는 컬럼에 함수를 씌우므로 (user_id, record_date)
        // 인덱스를 타지 못한다. 범위 조건으로 바꾸면 레인지 스캔이 된다.
        $start = Carbon::create($request->integer('year'), $request->integer('month'), 1)->startOfMonth();

        $dates = WorkoutLog::where('user_id', $request->user()->id)
            ->whereBetween('record_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()])
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

        // firstOrCreate는 이미 있는 일지를 찾아도 201 Created를 주고, 전달된
        // memo를 무시했다(생성할 때만 반영). 동시 요청이 겹치면 (user_id,
        // record_date) 유니크 제약에 걸려 500이 날 수도 있다.
        $attributes = [
            'user_id'     => $request->user()->id,
            'record_date' => $request->record_date,
        ];

        $existed = WorkoutLog::where($attributes)->exists();

        try {
            $log = WorkoutLog::updateOrCreate($attributes, ['memo' => $request->memo]);
        } catch (UniqueConstraintViolationException) {
            // 같은 날짜로 두 요청이 동시에 들어온 경우. 먼저 만든 쪽을 쓴다.
            $log = WorkoutLog::where($attributes)->firstOrFail();
            $log->update(['memo' => $request->memo]);
            $existed = true;
        }

        return response()->json(WorkoutLogResource::make($log), $existed ? 200 : 201);
    }

    // 메모 수정
    public function update(Request $request, WorkoutLog $workoutLog)
    {
        $this->authorize('update', $workoutLog);

        $request->validate(['memo' => 'nullable|string']);

        $workoutLog->update(['memo' => $request->memo]);

        return response()->json(WorkoutLogResource::make($workoutLog));
    }

    // 일지 삭제 (세트도 cascade로 자동 삭제)
    public function destroy(Request $request, WorkoutLog $workoutLog)
    {
        $this->authorize('delete', $workoutLog);

        $workoutLog->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }

    // 세트 추가
    public function addSet(Request $request, WorkoutLog $workoutLog)
    {
        $this->authorize('update', $workoutLog);

        $request->validate([
            'exercise_id' => ['required', Exercise::accessibleRule($request->user()->id)],
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

        return response()->json(WorkoutSetResource::make($set->load('exercise')), 201);
    }

    // 세트 수정
    public function updateSet(Request $request, WorkoutLog $workoutLog, WorkoutSet $set)
    {
        $this->authorize('update', $workoutLog);

        // 세트가 이 일지에 속하는지 확인 (다른 일지의 세트 ID를 끼워넣는 것 차단)
        if ($set->workout_log_id != $workoutLog->id) {
            return response()->json(['message' => '세트를 찾을 수 없습니다.'], 404);
        }

        $request->validate([
            'reps'   => 'required|integer|min:1|max:'.self::MAX_REPS,
            'weight' => 'required|numeric|min:0|max:'.self::MAX_WEIGHT,
        ]);

        $set->update($request->only('reps', 'weight'));

        return response()->json(WorkoutSetResource::make($set->load('exercise')));
    }

    // 세트 삭제
    public function deleteSet(Request $request, WorkoutLog $workoutLog, WorkoutSet $set)
    {
        $this->authorize('update', $workoutLog);

        // 세트가 이 일지에 속하는지 확인 (다른 일지의 세트 ID를 끼워넣는 것 차단)
        if ($set->workout_log_id != $workoutLog->id) {
            return response()->json(['message' => '세트를 찾을 수 없습니다.'], 404);
        }

        $exerciseId = $set->exercise_id;

        // 삭제와 번호 재정렬은 하나의 동작이다. 나눠 놓으면 중간에 실패했을 때
        // 세트 번호가 1,3,4처럼 뒤엉킨 채 남고 되돌릴 지점이 없다.
        DB::transaction(function () use ($set, $workoutLog, $exerciseId) {
            $set->delete();

            WorkoutSet::where('workout_log_id', $workoutLog->id)
                ->where('exercise_id', $exerciseId)
                ->orderBy('set_number')
                ->get()
                ->each(function ($s, $index) {
                    $s->update(['set_number' => $index + 1]);
                });
        });

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
