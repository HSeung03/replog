<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\TemplateExercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutSet;
use App\Models\WorkoutTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * exercises 삭제는 FK cascade로 workout_sets까지 지운다.
 * 사용자가 규모를 모른 채 몇 달치 기록을 날리지 않도록,
 * 참조가 있으면 409로 한 번 막고 force에서만 진행한다.
 */
class ExerciseDeleteGuardTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    private function customExercise(): Exercise
    {
        return Exercise::create([
            'name'       => '나만의 종목',
            'category'   => '가슴',
            'is_default' => false,
            'user_id'    => $this->user->id,
        ]);
    }

    private function recordSets(Exercise $exercise, int $count): void
    {
        $log = WorkoutLog::create(['user_id' => $this->user->id, 'record_date' => '2026-04-24']);

        for ($i = 1; $i <= $count; $i++) {
            WorkoutSet::create([
                'workout_log_id' => $log->id,
                'exercise_id'    => $exercise->id,
                'set_number'     => $i,
                'reps'           => 10,
                'weight'         => 60,
            ]);
        }
    }

    public function test_unused_exercise_deletes_without_a_warning(): void
    {
        $exercise = $this->customExercise();

        $this->actingAs($this->user)
            ->deleteJson("/api/exercises/{$exercise->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('exercises', ['id' => $exercise->id]);
    }

    public function test_exercise_with_recorded_sets_is_blocked_and_reports_the_impact(): void
    {
        $exercise = $this->customExercise();
        $this->recordSets($exercise, 3);

        $this->actingAs($this->user)
            ->deleteJson("/api/exercises/{$exercise->id}")
            ->assertStatus(409)
            ->assertJson(['sets_count' => 3, 'templates_count' => 0]);

        // 막혔으니 종목도 세트도 그대로 남아야 한다.
        $this->assertDatabaseHas('exercises', ['id' => $exercise->id]);
        $this->assertDatabaseCount('workout_sets', 3);
    }

    public function test_force_deletes_the_exercise_and_its_sets(): void
    {
        $exercise = $this->customExercise();
        $this->recordSets($exercise, 3);

        $this->actingAs($this->user)
            ->deleteJson("/api/exercises/{$exercise->id}?force=1")
            ->assertStatus(200)
            ->assertJson(['deleted_sets_count' => 3]);

        $this->assertDatabaseMissing('exercises', ['id' => $exercise->id]);
        $this->assertDatabaseCount('workout_sets', 0);
    }

    public function test_exercise_used_only_by_a_template_is_also_blocked(): void
    {
        $exercise = $this->customExercise();
        $template = WorkoutTemplate::create(['user_id' => $this->user->id, 'name' => '월요일 루틴']);
        TemplateExercise::create([
            'template_id' => $template->id,
            'exercise_id' => $exercise->id,
            'sort_order'  => 1,
        ]);

        $this->actingAs($this->user)
            ->deleteJson("/api/exercises/{$exercise->id}")
            ->assertStatus(409)
            ->assertJson(['sets_count' => 0, 'templates_count' => 1]);

        $this->assertDatabaseHas('exercises', ['id' => $exercise->id]);
    }

    public function test_force_does_not_let_you_delete_someone_elses_exercise(): void
    {
        $exercise = $this->customExercise();
        $other    = User::factory()->create();

        $this->actingAs($other)
            ->deleteJson("/api/exercises/{$exercise->id}?force=1")
            ->assertStatus(403);

        $this->assertDatabaseHas('exercises', ['id' => $exercise->id]);
    }

    public function test_force_does_not_let_you_delete_a_default_exercise(): void
    {
        $default = Exercise::create(['name' => '벤치프레스', 'category' => '가슴', 'is_default' => true]);

        $this->actingAs($this->user)
            ->deleteJson("/api/exercises/{$default->id}?force=1")
            ->assertStatus(403);

        $this->assertDatabaseHas('exercises', ['id' => $default->id]);
    }
}
