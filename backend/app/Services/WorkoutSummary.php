<?php

namespace App\Services;

use App\Models\BodyRecord;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/*
 * 한 사용자의 기간별 운동 집계.
 *
 * 이 클래스가 따로 있는 이유는 결과를 두 곳에서 쓰기 때문이다. 하나는
 * /api/insights/summary로 화면에 바로 보여 주는 경로이고, 다른 하나는
 * 요약·식단·루틴을 만들 때 모델에 넘길 입력이다. 컨트롤러 안에 두면
 * 두 번째 경로에서 다시 쓸 수 없다.
 *
 * 모델에 세트 원본을 그대로 넘기지 않는 것이 요점이다. 4주치면 수백 행인데,
 * 토큰을 그만큼 쓰고도 합계와 평균은 모델이 직접 세면서 틀린다. 산수는 여기서
 * 끝내고 모델에는 결과 해석만 시킨다.
 */
class WorkoutSummary
{
    /** 기간을 안 주면 최근 4주를 본다. */
    public const DEFAULT_PERIOD_DAYS = 28;

    /** 한 번에 볼 수 있는 최대 기간. 무한정 넓은 조회로 DB를 훑지 않도록 막는다. */
    public const MAX_PERIOD_DAYS = 366;

    public function build(User $user, Carbon $start, Carbon $end): array
    {
        $sets = $this->fetchSets($user, $start, $end);
        $days = $start->diffInDays($end) + 1; // 양끝 포함

        // 직전 같은 길이의 기간. "지난번보다 늘었나 줄었나"의 기준이 된다.
        $prevEnd   = $start->copy()->subDay();
        $prevStart = $prevEnd->copy()->subDays($days - 1);

        return [
            'period' => [
                'start' => $start->toDateString(),
                'end'   => $end->toDateString(),
                'days'  => $days,
            ],
            'has_data'      => $sets->isNotEmpty(),
            'totals'        => $this->totals($sets, $days),
            'by_category'   => $this->byCategory($sets),
            'by_exercise'   => $this->byExercise($sets),
            'previous'      => $this->totals($this->fetchSets($user, $prevStart, $prevEnd), $days) + [
                'start' => $prevStart->toDateString(),
                'end'   => $prevEnd->toDateString(),
            ],
            'body'          => $this->body($user, $start, $end),
            'profile'       => $this->profile($user),
        ];
    }

    /*
     * Eloquent 대신 쿼리 빌더를 쓴다. 합계를 내려고 세트 수백 개를 모델로
     * 살려 낼 이유가 없다. user_id 조건이 쿼리에 박혀 있어 남의 기록은 애초에
     * 나오지 않는다.
     */
    private function fetchSets(User $user, Carbon $start, Carbon $end)
    {
        return DB::table('workout_sets as s')
            ->join('workout_logs as l', 's.workout_log_id', '=', 'l.id')
            ->join('exercises as e', 's.exercise_id', '=', 'e.id')
            ->where('l.user_id', $user->id)
            ->whereBetween('l.record_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('l.record_date')
            ->select([
                'l.record_date',
                's.exercise_id',
                's.reps',
                's.weight',
                'e.name as exercise_name',
                'e.category',
            ])
            ->get();
    }

    private function totals($sets, int $days): array
    {
        $volume = 0.0;
        foreach ($sets as $set) {
            $volume += $set->weight * $set->reps;
        }

        $workoutDays = $sets->pluck('record_date')->unique()->count();

        return [
            'workout_days'     => $workoutDays,
            'total_sets'       => $sets->count(),
            'total_volume'     => round($volume, 1),
            // 주당 몇 번 나갔는가. 기간 길이가 달라도 비교할 수 있게 정규화한다.
            'weekly_frequency' => $days > 0 ? round($workoutDays / $days * 7, 1) : 0.0,
        ];
    }

    private function byCategory($sets): array
    {
        $totalVolume = 0.0;
        $groups = [];

        foreach ($sets as $set) {
            $volume = $set->weight * $set->reps;
            $totalVolume += $volume;

            $groups[$set->category] ??= ['category' => $set->category, 'sets' => 0, 'volume' => 0.0];
            $groups[$set->category]['sets']++;
            $groups[$set->category]['volume'] += $volume;
        }

        $result = [];
        foreach ($groups as $group) {
            $group['volume'] = round($group['volume'], 1);
            // 부위 편중을 보는 값. 루틴을 다시 짤 때 제일 먼저 보게 된다.
            $group['share'] = $totalVolume > 0 ? round($group['volume'] / $totalVolume, 3) : 0.0;
            $result[] = $group;
        }

        usort($result, fn ($a, $b) => $b['volume'] <=> $a['volume']);

        return $result;
    }

    private function byExercise($sets): array
    {
        $groups = [];

        foreach ($sets as $set) {
            $id = $set->exercise_id;

            $groups[$id] ??= [
                'exercise_id' => $id,
                'name'        => $set->exercise_name,
                'category'    => $set->category,
                'sets'        => 0,
                'volume'      => 0.0,
                'best_1rm'    => null,
                'sessions'    => [], // record_date => 그날의 최고 1RM
            ];

            $groups[$id]['sets']++;
            $groups[$id]['volume'] += $set->weight * $set->reps;

            $oneRm = $this->brzycki((float) $set->weight, (int) $set->reps);
            if ($oneRm === null) {
                continue;
            }

            $groups[$id]['best_1rm'] = max($groups[$id]['best_1rm'] ?? 0, $oneRm);

            $date = $set->record_date;
            $groups[$id]['sessions'][$date] = max($groups[$id]['sessions'][$date] ?? 0, $oneRm);
        }

        $result = [];
        foreach ($groups as $group) {
            $sessions = $group['sessions'];
            unset($group['sessions']);

            $group['volume']   = round($group['volume'], 1);
            $group['sessions'] = count($sessions);

            /*
             * 정체 판단의 근거. 첫 세션과 마지막 세션의 최고 1RM을 견준다.
             * 세션이 하나뿐이면 비교 대상이 없으므로 null로 둔다. 0으로 두면
             * "제자리걸음"과 구분되지 않는다.
             */
            $group['first_1rm'] = $sessions ? reset($sessions) : null;
            $group['last_1rm']  = $sessions ? end($sessions) : null;
            $group['change_1rm'] = count($sessions) >= 2
                ? round($group['last_1rm'] - $group['first_1rm'], 1)
                : null;

            $result[] = $group;
        }

        usort($result, fn ($a, $b) => $b['volume'] <=> $a['volume']);

        return $result;
    }

    /*
     * Brzycki 공식. mobile/src/utils/logStats.js의 calc1RM과 같은 식이어야 한다.
     * 37회 이상은 분모가 0 이하가 되어 식이 무너지므로 값을 내지 않는다.
     */
    private function brzycki(float $weight, int $reps): ?float
    {
        if ($reps <= 0 || $reps >= 37) {
            return null;
        }

        if ($reps === 1) {
            return round($weight, 1);
        }

        return round($weight * 36 / (37 - $reps), 1);
    }

    /*
     * 체중 추이. 식단 쪽에서 "감량 목표인데 체중이 그대로다" 같은 판단의 근거가 된다.
     * 기간 안에 측정이 없을 수 있으므로 최신 한 건은 기간 밖에서도 가져온다.
     */
    private function body(User $user, Carbon $start, Carbon $end): array
    {
        $latest = BodyRecord::where('user_id', $user->id)
            ->where('measured_at', '<=', $end->toDateString())
            ->orderByDesc('measured_at')
            ->first();

        $atStart = BodyRecord::where('user_id', $user->id)
            ->where('measured_at', '<=', $start->toDateString())
            ->orderByDesc('measured_at')
            ->first();

        return [
            'latest' => $latest ? [
                'measured_at' => (string) $latest->measured_at,
                'weight'      => (float) $latest->weight,
                'muscle_mass' => (float) $latest->muscle_mass,
                'body_fat'    => (float) $latest->body_fat,
            ] : null,
            'weight_change' => $latest && $atStart && $latest->id !== $atStart->id
                ? round($latest->weight - $atStart->weight, 2)
                : null,
        ];
    }

    /*
     * 프로필을 함께 실어 준다. 이 응답 하나가 요약·식단·루틴 생성의 입력이 되므로
     * 호출하는 쪽이 두 군데를 짜맞추지 않아도 되게 한다.
     *
     * missing은 "아직 못 만드는 기능"을 화면이 판단하는 근거다. 키가 없으면
     * 식단은 시작조차 할 수 없다.
     */
    private function profile(User $user): array
    {
        $profile = $user->profile;

        $required = ['birth_date', 'gender', 'height', 'goal', 'activity_level'];
        $missing  = [];

        foreach ($required as $field) {
            if ($profile === null || $profile->{$field} === null) {
                $missing[] = $field;
            }
        }

        return [
            'filled'  => $profile !== null,
            'missing' => $missing,
            'goal'                => $profile?->goal,
            'age'                 => $profile?->age(),
            'gender'              => $profile?->gender,
            'height'              => $profile?->height,
            'activity_level'      => $profile?->activity_level,
            'experience_level'    => $profile?->experience_level,
            'weekly_workout_days' => $profile?->weekly_workout_days,
            'dietary_restrictions' => $profile?->dietary_restrictions ?? [],
        ];
    }
}
