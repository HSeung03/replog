<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\WorkoutSet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OneRmController extends Controller
{
    // 1RM 챌린지 대상 종목 (벤치프레스, 스쿼트, 데드리프트)
    private const TARGET_EXERCISES = ['벤치프레스', '스쿼트', '데드리프트'];

    // Brzycki 공식: weight × 36 / (37 - reps)
    private function brzycki(float $weight, int $reps): float
    {
        if ($reps >= 37) return 0;
        return round($weight * 36 / (37 - $reps), 1);
    }

    // 3대 운동 1RM 현황 조회
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $result = [];

        foreach (self::TARGET_EXERCISES as $name) {
            $exercise = Exercise::where('name', $name)->where('is_default', true)->first();

            if (!$exercise) {
                $result[$name] = null;
                continue;
            }

            // 조건: 최근 2주 이내 + 해당 종목 운동 기록 1회 이상
            $twoWeeksAgo = now()->subWeeks(2)->toDateString();

            $hasRecentLog = WorkoutSet::where('exercise_id', $exercise->id)
                ->whereHas('log', fn($q) => $q->where('user_id', $userId)
                    ->where('record_date', '>=', $twoWeeksAgo))
                ->exists();

            if (!$hasRecentLog) {
                $result[$name] = [
                    'exercise_id' => $exercise->id,
                    'available'   => false,
                    'reason'      => '최근 2주 내 운동 기록이 없습니다.',
                    'best_1rm'    => null,
                ];
                continue;
            }

            // 전체 기록 중 최고 1RM 계산
            $bestSet = WorkoutSet::where('exercise_id', $exercise->id)
                ->whereHas('log', fn($q) => $q->where('user_id', $userId))
                ->where('reps', '<', 37)
                ->get()
                ->map(fn($set) => [
                    'date'   => $set->log->record_date,
                    'weight' => $set->weight,
                    'reps'   => $set->reps,
                    'one_rm' => $this->brzycki($set->weight, $set->reps),
                ])
                ->sortByDesc('one_rm')
                ->first();

            $result[$name] = [
                'exercise_id' => $exercise->id,
                'available'   => true,
                'best_1rm'    => $bestSet['one_rm'] ?? null,
                'best_set'    => $bestSet,
            ];
        }

        return response()->json($result);
    }
}
