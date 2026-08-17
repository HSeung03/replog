<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WorkoutLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkoutLogTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_create_workout_log(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/workout-logs', [
                'record_date' => '2026-04-24',
                'memo'        => '오늘 운동',
            ]);

        $response->assertStatus(201)->assertJsonStructure(['id', 'record_date']);
    }

    public function test_can_get_workout_log_by_date(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/workout-logs', ['record_date' => '2026-04-24']);

        $response = $this->actingAs($this->user)
            ->getJson('/api/workout-logs/2026-04-24');

        $response->assertStatus(200)->assertJsonStructure(['id', 'record_date']);
    }

    public function test_returns_204_when_no_log_for_date(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/workout-logs/2000-01-01');

        $response->assertStatus(204);
    }

    public function test_can_update_workout_log(): void
    {
        $logId = $this->actingAs($this->user)
            ->postJson('/api/workout-logs', ['record_date' => '2026-04-24'])
            ->json('id');

        $response = $this->actingAs($this->user)
            ->patchJson("/api/workout-logs/{$logId}", ['memo' => '수정된 메모']);

        $response->assertStatus(200)->assertJsonFragment(['memo' => '수정된 메모']);
    }

    public function test_can_delete_workout_log(): void
    {
        $logId = $this->actingAs($this->user)
            ->postJson('/api/workout-logs', ['record_date' => '2026-04-24'])
            ->json('id');

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/workout-logs/{$logId}");

        $response->assertStatus(200);
    }

    public function test_cannot_access_other_users_log(): void
    {
        $other = User::factory()->create();

        $logId = $this->actingAs($this->user)
            ->postJson('/api/workout-logs', ['record_date' => '2026-04-24'])
            ->json('id');

        $response = $this->actingAs($other)
            ->deleteJson("/api/workout-logs/{$logId}");

        $response->assertStatus(403);
    }

    // RF-13: firstOrCreate는 이미 있는 일지를 찾아도 201을 주고 memo를 무시했다.
    public function test_creating_log_for_existing_date_updates_memo_and_returns_200(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/workout-logs', ['record_date' => '2026-08-13', 'memo' => '첫 메모'])
            ->assertStatus(201);

        $this->actingAs($this->user)
            ->postJson('/api/workout-logs', ['record_date' => '2026-08-13', 'memo' => '고친 메모'])
            ->assertStatus(200)
            ->assertJsonFragment(['memo' => '고친 메모']);

        $this->assertSame(1, WorkoutLog::where('user_id', $this->user->id)->count());
    }

    // RF-10: whereYear/whereMonth를 범위 조건으로 바꾼 뒤에도 경계가 그대로인지 확인한다.
    public function test_calendar_returns_only_that_months_dates(): void
    {
        foreach (['2026-07-31', '2026-08-01', '2026-08-31', '2026-09-01'] as $date) {
            WorkoutLog::create(['user_id' => $this->user->id, 'record_date' => $date]);
        }

        $response = $this->actingAs($this->user)
            ->getJson('/api/workout-logs/calendar?year=2026&month=8');

        $response->assertStatus(200)->assertJsonCount(2);
        $this->assertSame(['2026-08-01', '2026-08-31'], $response->json());
    }

    public function test_unauthenticated_user_cannot_create_log(): void
    {
        $response = $this->postJson('/api/workout-logs', ['record_date' => '2026-04-24']);

        $response->assertStatus(401);
    }
}
