<?php

namespace App\Models;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
 * BE-05: exercise_id를 exists:exercises,id로만 검증하면 "존재하는 ID"까지만
 * 확인한다. 남의 커스텀 종목 ID를 넣어 세트를 만들면 응답의 load('exercise')에
 * 그 이름이 실려 돌아오므로, ID를 1부터 훑어 전체 사용자의 종목명을 열거할 수 있다.
 */
class ExerciseOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private WorkoutLog $log;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->log  = WorkoutLog::create(['user_id' => $this->user->id, 'record_date' => '2026-08-13']);
    }

    private function addSet(int $exerciseId)
    {
        return $this->actingAs($this->user)
            ->postJson("/api/workout-logs/{$this->log->id}/sets", [
                'exercise_id' => $exerciseId,
                'set_number'  => 1,
                'reps'        => 10,
                'weight'      => 60,
            ]);
    }

    public function test_cannot_add_set_with_another_users_custom_exercise(): void
    {
        $stranger = User::factory()->create();
        $private  = Exercise::create([
            'name'       => '남의 비밀 종목',
            'category'   => '팔',
            'is_default' => false,
            'user_id'    => $stranger->id,
        ]);

        $this->addSet($private->id)
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercise_id');

        $this->assertDatabaseMissing('workout_sets', ['exercise_id' => $private->id]);
    }

    public function test_can_add_set_with_own_custom_exercise(): void
    {
        $mine = Exercise::create([
            'name'       => '내 커스텀 종목',
            'category'   => '팔',
            'is_default' => false,
            'user_id'    => $this->user->id,
        ]);

        $this->addSet($mine->id)->assertStatus(201);
    }

    public function test_can_add_set_with_default_exercise(): void
    {
        $default = Exercise::create(['name' => '벤치프레스', 'category' => '가슴', 'is_default' => true]);

        $this->addSet($default->id)->assertStatus(201);
    }

    public function test_cannot_add_set_with_nonexistent_exercise(): void
    {
        $this->addSet(999999)
            ->assertStatus(422)
            ->assertJsonValidationErrors('exercise_id');
    }
}
