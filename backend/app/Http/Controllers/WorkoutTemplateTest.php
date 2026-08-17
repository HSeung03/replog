<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkoutTemplateTest extends TestCase
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
        $this->squat = Exercise::create(['name' => '스쿼트', 'category' => '하체', 'is_default' => true]);
    }

    private function makeTemplate(User $owner, array $exerciseIds = []): WorkoutTemplate
    {
        $template = WorkoutTemplate::create(['user_id' => $owner->id, 'name' => '가슴 데이']);

        $payload = [];
        foreach (array_values($exerciseIds) as $index => $id) {
            $payload[$id] = ['sort_order' => $index + 1];
        }
        $template->exercises()->sync($payload);

        return $template;
    }

    public function test_can_create_template_with_exercises(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/templates', [
            'name'      => '가슴 데이',
            'exercises' => [
                ['exercise_id' => $this->bench->id],
                ['exercise_id' => $this->squat->id],
            ],
        ]);

        $response->assertStatus(201)->assertJsonFragment(['name' => '가슴 데이']);

        $this->assertDatabaseHas('template_exercises', ['exercise_id' => $this->bench->id, 'sort_order' => 1]);
        $this->assertDatabaseHas('template_exercises', ['exercise_id' => $this->squat->id, 'sort_order' => 2]);
    }

    public function test_can_list_only_own_templates(): void
    {
        $this->makeTemplate($this->user);
        $this->makeTemplate(User::factory()->create());

        $response = $this->actingAs($this->user)->getJson('/api/templates');

        $response->assertStatus(200)->assertJsonCount(1);
    }

    public function test_cannot_read_other_users_template(): void
    {
        $template = $this->makeTemplate(User::factory()->create());

        $this->actingAs($this->user)
            ->getJson("/api/templates/{$template->id}")
            ->assertStatus(403)
            // Policy로 옮긴 뒤에도 응답 메시지가 그대로인지 확인한다
            ->assertJson(['message' => '권한이 없습니다.']);
    }

    public function test_cannot_update_other_users_template(): void
    {
        $template = $this->makeTemplate(User::factory()->create());

        $this->actingAs($this->user)
            ->patchJson("/api/templates/{$template->id}", ['name' => '탈취'])
            ->assertStatus(403);

        $this->assertDatabaseHas('workout_templates', ['id' => $template->id, 'name' => '가슴 데이']);
    }

    public function test_cannot_delete_other_users_template(): void
    {
        $template = $this->makeTemplate(User::factory()->create());

        $this->actingAs($this->user)
            ->deleteJson("/api/templates/{$template->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('workout_templates', ['id' => $template->id]);
    }

    public function test_update_replaces_exercise_list_and_resets_order(): void
    {
        $template = $this->makeTemplate($this->user, [$this->bench->id]);

        $this->actingAs($this->user)->patchJson("/api/templates/{$template->id}", [
            'exercises' => [
                ['exercise_id' => $this->squat->id],
                ['exercise_id' => $this->bench->id],
            ],
        ])->assertStatus(200);

        $this->assertDatabaseHas('template_exercises', ['exercise_id' => $this->squat->id, 'sort_order' => 1]);
        $this->assertDatabaseHas('template_exercises', ['exercise_id' => $this->bench->id, 'sort_order' => 2]);
        $this->assertSame(2, $template->exercises()->count());
    }

    // BE-06: 예전에는 전체 삭제 후 재등록이라, 재등록 중 실패하면 템플릿이 빈 채로 남았다.
    public function test_update_with_invalid_exercise_leaves_list_untouched(): void
    {
        $template = $this->makeTemplate($this->user, [$this->bench->id]);

        $this->actingAs($this->user)->patchJson("/api/templates/{$template->id}", [
            'exercises' => [
                ['exercise_id' => $this->squat->id],
                ['exercise_id' => 999999],
            ],
        ])->assertStatus(422);

        $this->assertDatabaseHas('template_exercises', [
            'template_id' => $template->id,
            'exercise_id' => $this->bench->id,
        ]);
        $this->assertSame(1, $template->exercises()->count());
    }

    // BE-05: 존재 여부만 보면 남의 커스텀 종목을 템플릿에 끼워넣을 수 있다.
    public function test_cannot_put_another_users_exercise_in_template(): void
    {
        $stranger = User::factory()->create();
        $private  = Exercise::create([
            'name'       => '남의 커스텀 종목',
            'category'   => '팔',
            'is_default' => false,
            'user_id'    => $stranger->id,
        ]);

        $this->actingAs($this->user)->postJson('/api/templates', [
            'name'      => '훔친 템플릿',
            'exercises' => [['exercise_id' => $private->id]],
        ])->assertStatus(422)->assertJsonValidationErrors('exercises.0.exercise_id');

        $this->assertDatabaseMissing('template_exercises', ['exercise_id' => $private->id]);
    }

    public function test_can_put_own_custom_exercise_in_template(): void
    {
        $mine = Exercise::create([
            'name'       => '내 커스텀 종목',
            'category'   => '팔',
            'is_default' => false,
            'user_id'    => $this->user->id,
        ]);

        $this->actingAs($this->user)->postJson('/api/templates', [
            'name'      => '내 템플릿',
            'exercises' => [['exercise_id' => $mine->id]],
        ])->assertStatus(201);

        $this->assertDatabaseHas('template_exercises', ['exercise_id' => $mine->id]);
    }

    public function test_unauthenticated_user_cannot_touch_templates(): void
    {
        $template = $this->makeTemplate($this->user);

        $this->getJson('/api/templates')->assertStatus(401);
        $this->postJson('/api/templates', ['name' => 'x'])->assertStatus(401);
        $this->patchJson("/api/templates/{$template->id}", ['name' => 'x'])->assertStatus(401);
        $this->deleteJson("/api/templates/{$template->id}")->assertStatus(401);
    }
}
