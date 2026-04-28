<?php

namespace Tests\Feature;

use App\Models\User;
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

    public function test_unauthenticated_user_cannot_create_log(): void
    {
        $response = $this->postJson('/api/workout-logs', ['record_date' => '2026-04-24']);

        $response->assertStatus(401);
    }
}
