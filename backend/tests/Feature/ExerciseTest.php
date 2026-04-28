<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExerciseTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_can_create_exercise(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/exercises', [
                'name'     => '벤치프레스',
                'category' => '가슴',
            ]);

        $response->assertStatus(201)->assertJsonFragment(['name' => '벤치프레스']);
    }

    public function test_can_list_exercises(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/exercises', ['name' => '스쿼트', 'category' => '하체']);

        $response = $this->actingAs($this->user)
            ->getJson('/api/exercises');

        $response->assertStatus(200)->assertJsonStructure([['id', 'name']]);
    }

    public function test_can_delete_exercise(): void
    {
        $exerciseId = $this->actingAs($this->user)
            ->postJson('/api/exercises', ['name' => '데드리프트', 'category' => '등'])
            ->json('id');

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/exercises/{$exerciseId}");

        $response->assertStatus(200);
    }

    public function test_cannot_delete_other_users_exercise(): void
    {
        $other = User::factory()->create();

        $exerciseId = $this->actingAs($this->user)
            ->postJson('/api/exercises', ['name' => '풀업', 'category' => '등'])
            ->json('id');

        $response = $this->actingAs($other)
            ->deleteJson("/api/exercises/{$exerciseId}");

        $response->assertStatus(403);
    }
}
