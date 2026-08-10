<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutSet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkoutSetTest extends TestCase
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

    private function makeSet(WorkoutLog $log, int $setNumber = 1): WorkoutSet
    {
        return WorkoutSet::create([
            'workout_log_id' => $log->id,
            'exercise_id'    => $this->exercise->id,
            'set_number'     => $setNumber,
            'reps'           => 10,
            'weight'         => 60,
        ]);
    }

    public function test_can_add_set(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/workout-logs/{$this->log->id}/sets", [
                'exercise_id' => $this->exercise->id,
                'set_number'  => 1,
                'reps'        => 10,
                'weight'      => 60,
            ]);

        $response->assertStatus(201)->assertJsonFragment(['reps' => 10]);
    }

    public function test_cannot_add_set_to_other_users_log(): void
    {
        $other = User::factory()->create();

        $response = $this->actingAs($other)
            ->postJson("/api/workout-logs/{$this->log->id}/sets", [
                'exercise_id' => $this->exercise->id,
                'set_number'  => 1,
                'reps'        => 10,
                'weight'      => 60,
            ]);

        $response->assertStatus(403);
    }

    public function test_can_update_own_set(): void
    {
        $set = $this->makeSet($this->log);

        $response = $this->actingAs($this->user)
            ->patchJson("/api/workout-logs/{$this->log->id}/sets/{$set->id}", [
                'reps'   => 12,
                'weight' => 70,
            ]);

        $response->assertStatus(200)->assertJsonFragment(['reps' => 12]);
    }

    public function test_can_delete_own_set(): void
    {
        $set = $this->makeSet($this->log);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/workout-logs/{$this->log->id}/sets/{$set->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('workout_sets', ['id' => $set->id]);
    }

    public function test_set_numbers_are_resequenced_after_delete(): void
    {
        $first  = $this->makeSet($this->log, 1);
        $second = $this->makeSet($this->log, 2);
        $third  = $this->makeSet($this->log, 3);

        $this->actingAs($this->user)
            ->deleteJson("/api/workout-logs/{$this->log->id}/sets/{$first->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('workout_sets', ['id' => $second->id, 'set_number' => 1]);
        $this->assertDatabaseHas('workout_sets', ['id' => $third->id, 'set_number' => 2]);
    }

    public function test_cannot_update_set_belonging_to_another_users_log(): void
    {
        $attacker    = User::factory()->create();
        $attackerLog = WorkoutLog::create(['user_id' => $attacker->id, 'record_date' => '2026-04-24']);
        $victimSet   = $this->makeSet($this->log);

        // 공격자 소유의 일지 ID + 피해자 세트 ID 조합
        $response = $this->actingAs($attacker)
            ->patchJson("/api/workout-logs/{$attackerLog->id}/sets/{$victimSet->id}", [
                'reps'   => 1,
                'weight' => 999,
            ]);

        $response->assertStatus(404);
        $this->assertDatabaseHas('workout_sets', [
            'id'     => $victimSet->id,
            'reps'   => 10,
            'weight' => 60,
        ]);
    }

    public function test_cannot_delete_set_belonging_to_another_users_log(): void
    {
        $attacker    = User::factory()->create();
        $attackerLog = WorkoutLog::create(['user_id' => $attacker->id, 'record_date' => '2026-04-24']);
        $victimSet   = $this->makeSet($this->log);

        $response = $this->actingAs($attacker)
            ->deleteJson("/api/workout-logs/{$attackerLog->id}/sets/{$victimSet->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('workout_sets', ['id' => $victimSet->id]);
    }

    public function test_cannot_update_set_belonging_to_another_log_of_same_user(): void
    {
        $otherLog  = WorkoutLog::create(['user_id' => $this->user->id, 'record_date' => '2026-04-25']);
        $targetSet = $this->makeSet($otherLog);

        $response = $this->actingAs($this->user)
            ->patchJson("/api/workout-logs/{$this->log->id}/sets/{$targetSet->id}", [
                'reps'   => 1,
                'weight' => 999,
            ]);

        $response->assertStatus(404);
        $this->assertDatabaseHas('workout_sets', ['id' => $targetSet->id, 'reps' => 10]);
    }

    public function test_unauthenticated_user_cannot_touch_sets(): void
    {
        $set = $this->makeSet($this->log);

        $this->patchJson("/api/workout-logs/{$this->log->id}/sets/{$set->id}", [
            'reps'   => 5,
            'weight' => 50,
        ])->assertStatus(401);

        $this->deleteJson("/api/workout-logs/{$this->log->id}/sets/{$set->id}")
            ->assertStatus(401);
    }
}
