<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * 컬럼이 담을 수 없는 값은 DB까지 가기 전에 422로 막아야 한다.
 *
 * MySQL strict 모드에서는 범위를 넘기면 SQLSTATE 22003으로 500이 나지만,
 * sqlite는 decimal/unsigned 제약을 강제하지 않아 조용히 잘린 값이 저장된다.
 * 그래서 여기서는 "저장 여부"가 아니라 "검증 단계에서 거부되는지"를 본다.
 */
class NumericRangeTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private WorkoutLog $log;
    private Exercise $exercise;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user     = User::factory()->create();
        $this->exercise = Exercise::create(['name' => '벤치프레스', 'category' => '가슴', 'is_default' => true]);
        $this->log      = WorkoutLog::create(['user_id' => $this->user->id, 'record_date' => '2026-04-24']);
    }

    private function addSet(array $overrides): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->user)->postJson("/api/workout-logs/{$this->log->id}/sets", array_merge([
            'exercise_id' => $this->exercise->id,
            'set_number'  => 1,
            'reps'        => 10,
            'weight'      => 60,
        ], $overrides));
    }

    public static function outOfRangeSetProvider(): array
    {
        return [
            // decimal(5,2)는 999.99가 한계다. 숫자 오타 한 번이면 닿는다.
            'weight 1000'      => [['weight' => 1000], 'weight'],
            'weight 10000'     => [['weight' => 10000], 'weight'],
            // unsignedTinyInteger
            'set_number 256'   => [['set_number' => 256], 'set_number'],
            // unsignedSmallInteger
            'reps 65536'       => [['reps' => 65536], 'reps'],
        ];
    }

    #[DataProvider('outOfRangeSetProvider')]
    public function test_set_values_beyond_column_range_are_rejected(array $payload, string $field): void
    {
        $this->addSet($payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors($field);

        $this->assertDatabaseCount('workout_sets', 0);
    }

    public function test_set_values_at_the_column_limit_are_accepted(): void
    {
        $this->addSet(['weight' => 999.99, 'reps' => 65535, 'set_number' => 255])
            ->assertStatus(201);
    }

    public function test_updating_a_set_beyond_column_range_is_rejected(): void
    {
        $setId = $this->addSet([])->json('id');

        $this->actingAs($this->user)
            ->patchJson("/api/workout-logs/{$this->log->id}/sets/{$setId}", [
                'reps'   => 10,
                'weight' => 1000,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('weight');
    }

    public function test_body_fat_of_100_is_rejected_because_the_column_stops_at_99_99(): void
    {
        // 기존 규칙은 max:100이라 이 값이 통과한 뒤 저장 단계에서 터졌다.
        $this->actingAs($this->user)
            ->postJson('/api/body-records', [
                'measured_at' => '2026-04-24',
                'weight'      => 70,
                'muscle_mass' => 30,
                'body_fat'    => 100,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('body_fat');

        $this->assertDatabaseCount('body_records', 0);
    }

    public function test_body_fat_just_under_the_limit_is_accepted(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/body-records', [
                'measured_at' => '2026-04-24',
                'weight'      => 70,
                'muscle_mass' => 30,
                'body_fat'    => 99.99,
            ])
            ->assertStatus(201);
    }

    public function test_body_record_weight_beyond_column_range_is_rejected(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/body-records', [
                'measured_at' => '2026-04-24',
                'weight'      => 1000,
                'muscle_mass' => 30,
                'body_fat'    => 20,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('weight');
    }

    public function test_updating_a_body_record_beyond_column_range_is_rejected(): void
    {
        $recordId = $this->actingAs($this->user)
            ->postJson('/api/body-records', [
                'measured_at' => '2026-04-24',
                'weight'      => 70,
                'muscle_mass' => 30,
                'body_fat'    => 20,
            ])->json('id');

        $this->actingAs($this->user)
            ->patchJson("/api/body-records/{$recordId}", ['body_fat' => 100])
            ->assertStatus(422)
            ->assertJsonValidationErrors('body_fat');
    }
}
