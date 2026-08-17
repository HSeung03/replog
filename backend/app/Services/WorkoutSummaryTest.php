<?php

namespace App\Services;

use App\Models\BodyRecord;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutSet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class WorkoutSummaryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Exercise $bench;
    private Exercise $squat;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user  = User::factory()->create();
        $this->bench = Exercise::create(['name' => '벤치프레스', 'category' => '가슴', 'is_default' => true]);
        $this->squat = Exercise::create(['name' => '스쿼트',     'category' => '하체', 'is_default' => true]);
    }

    /** 그날 일지에 세트들을 꽂아 넣는다. $sets는 [[무게, 횟수], ...] */
    private function log(string $date, Exercise $exercise, array $sets, ?User $owner = null): void
    {
        $log = WorkoutLog::create([
            'user_id'     => ($owner ?? $this->user)->id,
            'record_date' => $date,
        ]);

        foreach ($sets as $i => [$weight, $reps]) {
            WorkoutSet::create([
                'workout_log_id' => $log->id,
                'exercise_id'    => $exercise->id,
                'set_number'     => $i + 1,
                'weight'         => $weight,
                'reps'           => $reps,
            ]);
        }
    }

    private function summary(array $query = []): array
    {
        return $this->actingAs($this->user)
            ->getJson('/api/insights/summary?'.http_build_query($query))
            ->assertOk()
            ->json();
    }

    public function test_볼륨은_무게_곱하기_횟수의_합이다(): void
    {
        $this->log('2026-08-10', $this->bench, [[60, 10], [70, 8]]); // 600 + 560

        $totals = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['totals'];

        $this->assertSame(2, $totals['total_sets']);
        $this->assertEquals(1160.0, $totals['total_volume']);
    }

    public function test_같은_날_두_종목을_해도_운동일은_하루다(): void
    {
        $log = WorkoutLog::create(['user_id' => $this->user->id, 'record_date' => '2026-08-10']);
        foreach ([$this->bench, $this->squat] as $i => $exercise) {
            WorkoutSet::create([
                'workout_log_id' => $log->id, 'exercise_id' => $exercise->id,
                'set_number' => 1, 'weight' => 60, 'reps' => 10,
            ]);
        }

        $totals = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['totals'];

        $this->assertSame(1, $totals['workout_days']);
        $this->assertSame(2, $totals['total_sets']);
    }

    public function test_주당_빈도는_기간_길이로_정규화된다(): void
    {
        // 14일 동안 4일 나갔으면 주 2회
        foreach (['2026-08-04', '2026-08-06', '2026-08-11', '2026-08-13'] as $date) {
            $this->log($date, $this->bench, [[60, 10]]);
        }

        $totals = $this->summary(['from' => '2026-08-04', 'to' => '2026-08-17'])['totals'];

        $this->assertSame(4, $totals['workout_days']);
        $this->assertEquals(2.0, $totals['weekly_frequency']);
    }

    public function test_부위별_비중은_볼륨_기준이고_합이_1이다(): void
    {
        $this->log('2026-08-10', $this->bench, [[50, 10]]);  // 가슴 500
        $this->log('2026-08-11', $this->squat, [[100, 15]]); // 하체 1500

        $byCategory = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['by_category'];

        // 볼륨이 큰 순서로 정렬된다
        $this->assertSame('하체', $byCategory[0]['category']);
        $this->assertEquals(0.75, $byCategory[0]['share']);
        $this->assertEquals(0.25, $byCategory[1]['share']);
        $this->assertEquals(1.0, array_sum(array_column($byCategory, 'share')));
    }

    /*
     * Brzycki: weight * 36 / (37 - reps)
     * 60kg 10회 → 60 * 36 / 27 = 80.0
     */
    public function test_1rm은_brzycki_공식을_따른다(): void
    {
        $this->log('2026-08-10', $this->bench, [[60, 10]]);

        $byExercise = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['by_exercise'];

        $this->assertEquals(80.0, $byExercise[0]['best_1rm']);
    }

    /*
     * 37회 이상은 분모가 0 이하가 되어 식이 무너진다.
     * 값을 내지 않을 뿐 세트 수와 볼륨에는 그대로 들어가야 한다.
     */
    public function test_37회_이상은_1rm을_내지_않는다(): void
    {
        $this->log('2026-08-10', $this->bench, [[20, 40]]);

        $byExercise = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['by_exercise'];

        $this->assertNull($byExercise[0]['best_1rm']);
        $this->assertSame(1, $byExercise[0]['sets']);
        $this->assertEquals(800.0, $byExercise[0]['volume']);
    }

    public function test_세션이_하나면_변화량은_null이다(): void
    {
        $this->log('2026-08-10', $this->bench, [[60, 10]]);

        $byExercise = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['by_exercise'];

        $this->assertSame(1, $byExercise[0]['sessions']);
        $this->assertNull($byExercise[0]['change_1rm']);
    }

    public function test_첫_세션과_마지막_세션의_1rm_차이를_낸다(): void
    {
        $this->log('2026-08-03', $this->bench, [[60, 10]]); // 80.0
        $this->log('2026-08-10', $this->bench, [[65, 10]]); // 86.7

        $byExercise = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['by_exercise'];

        $this->assertEquals(80.0, $byExercise[0]['first_1rm']);
        $this->assertEquals(86.7, $byExercise[0]['last_1rm']);
        $this->assertEquals(6.7, $byExercise[0]['change_1rm']);
    }

    public function test_직전_동일_길이_기간과_비교한다(): void
    {
        $this->log('2026-08-10', $this->bench, [[60, 10]]);  // 이번 기간 600
        $this->log('2026-08-03', $this->bench, [[100, 10]]); // 직전 기간 1000

        $summary = $this->summary(['from' => '2026-08-08', 'to' => '2026-08-14']);

        $this->assertEquals(600.0, $summary['totals']['total_volume']);
        $this->assertSame('2026-08-01', $summary['previous']['start']);
        $this->assertSame('2026-08-07', $summary['previous']['end']);
        $this->assertEquals(1000.0, $summary['previous']['total_volume']);
    }

    public function test_기간_밖의_기록은_세지_않는다(): void
    {
        $this->log('2026-07-20', $this->bench, [[60, 10]]);

        $summary = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17']);

        $this->assertFalse($summary['has_data']);
        $this->assertSame(0, $summary['totals']['total_sets']);
        $this->assertSame([], $summary['by_exercise']);
    }

    public function test_남의_기록은_섞이지_않는다(): void
    {
        $other = User::factory()->create();
        $this->log('2026-08-10', $this->bench, [[200, 10]], $other);

        $summary = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17']);

        $this->assertSame(0, $summary['totals']['total_sets']);
    }

    /*
     * now()를 그대로 쓰면 자정을 넘기는 순간 기대값과 실제값의 날짜가 갈린다.
     * 시간에 기대는 테스트는 시간을 고정해 놓고 본다.
     */
    public function test_기간을_안_주면_최근_4주를_본다(): void
    {
        Carbon::setTestNow('2026-08-17 09:00:00');

        $summary = $this->summary();

        $this->assertSame(28, $summary['period']['days']);
        $this->assertSame('2026-08-17', $summary['period']['end']);
        $this->assertSame('2026-07-21', $summary['period']['start']);

        Carbon::setTestNow();
    }

    public function test_프로필이_비면_무엇이_없는지_알려준다(): void
    {
        $summary = $this->summary();

        $this->assertFalse($summary['profile']['filled']);
        $this->assertContains('height', $summary['profile']['missing']);
    }

    public function test_프로필을_채우면_missing이_비고_나이가_실린다(): void
    {
        $this->actingAs($this->user)->putJson('/api/profile', [
            'birth_date'     => now()->subYears(30)->toDateString(),
            'gender'         => 'male',
            'height'         => 174.5,
            'goal'           => 'gain_muscle',
            'activity_level' => 'moderate',
        ])->assertOk();

        $profile = $this->summary()['profile'];

        $this->assertTrue($profile['filled']);
        $this->assertSame([], $profile['missing']);
        $this->assertSame(30, $profile['age']);
    }

    /*
     * 기간 안에 측정이 없어도 최신 한 건은 기간 밖에서 끌어온다.
     * 인바디는 매주 재는 게 아니라서, 기간으로 자르면 대부분 null이 된다.
     */
    public function test_체중은_기간_밖의_최신값도_가져온다(): void
    {
        BodyRecord::create([
            'user_id' => $this->user->id, 'measured_at' => '2026-07-01',
            'weight' => 70.0, 'muscle_mass' => 33.0, 'body_fat' => 18.0,
        ]);

        $body = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['body'];

        $this->assertEquals(70.0, $body['latest']['weight']);
    }

    public function test_기간_동안의_체중_변화를_낸다(): void
    {
        foreach ([['2026-07-25', 72.0], ['2026-08-15', 70.5]] as [$date, $weight]) {
            BodyRecord::create([
                'user_id' => $this->user->id, 'measured_at' => $date,
                'weight' => $weight, 'muscle_mass' => 33.0, 'body_fat' => 18.0,
            ]);
        }

        $body = $this->summary(['from' => '2026-08-01', 'to' => '2026-08-17'])['body'];

        $this->assertEquals(70.5, $body['latest']['weight']);
        $this->assertEquals(-1.5, $body['weight_change']);
    }

    public function test_너무_긴_기간은_422로_막는다(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/insights/summary?from=2020-01-01&to=2026-08-17')
            ->assertStatus(422);
    }

    public function test_잘못된_날짜_형식은_422(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/insights/summary?from=2026-8-1')
            ->assertStatus(422)
            ->assertJsonValidationErrors('from');
    }

    public function test_비로그인은_401(): void
    {
        $this->getJson('/api/insights/summary')->assertStatus(401);
    }
}
