<?php

namespace App\Http\Controllers;

use App\Services\WorkoutSummary;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class InsightController extends Controller
{
    public function __construct(private WorkoutSummary $summary) {}

    /*
     * 기간별 운동 집계. 모델 호출이 없는 순수 통계다.
     *
     * 화면이 바로 그려도 되고, 요약·식단·루틴을 만들 때 그대로 입력으로 쓴다.
     * 이 단계에서 숫자를 확정해 두면 나중에 모델이 낸 값이 틀렸을 때
     * "집계가 틀린 건지 해석이 틀린 건지"를 가릴 수 있다.
     *
     * Policy가 없는 이유는 라우트 모델 바인딩이 없어서다. 조회 범위가
     * $request->user()로 쿼리 안에 박혀 있어 남의 기록이 섞일 경로가 없다.
     */
    public function summary(Request $request)
    {
        $validated = $request->validate([
            'from' => 'sometimes|date_format:Y-m-d',
            'to'   => 'sometimes|date_format:Y-m-d|after_or_equal:from',
        ]);

        $end = isset($validated['to'])
            ? Carbon::parse($validated['to'])
            : Carbon::today();

        $start = isset($validated['from'])
            ? Carbon::parse($validated['from'])
            : $end->copy()->subDays(WorkoutSummary::DEFAULT_PERIOD_DAYS - 1);

        // 10년치를 한 번에 달라는 요청으로 DB를 훑지 않도록 막는다.
        if ($start->diffInDays($end) + 1 > WorkoutSummary::MAX_PERIOD_DAYS) {
            return response()->json([
                'message' => '조회 기간은 최대 '.WorkoutSummary::MAX_PERIOD_DAYS.'일입니다.',
            ], 422);
        }

        return response()->json($this->summary->build($request->user(), $start, $end));
    }
}
