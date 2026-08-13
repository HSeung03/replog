<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutSet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
 * RF-03: 모델을 그대로 반환하면 내부 컬럼이 응답에 실려 나가고,
 * decimal 컬럼이 드라이버에 따라 "60.00" 문자열로 나간다.
 */
class ApiResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_does_not_expose_internal_columns(): void
    {
        $user = User::factory()->create(['google_id' => 'g-123']);

        $response = $this->actingAs($user)->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJson(['id' => $user->id, 'name' => $user->name, 'email' => $user->email])
            ->assertJsonMissingPath('google_id')
            ->assertJsonMissingPath('email_verified_at')
            ->assertJsonMissingPath('created_at')
            ->assertJsonMissingPath('updated_at');
    }

    public function test_login_response_does_not_expose_internal_columns(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonMissingPath('user.google_id')
            ->assertJsonMissingPath('user.email_verified_at');
    }

    public function test_set_weight_is_a_number_not_a_string(): void
    {
        $user     = User::factory()->create();
        $exercise = Exercise::create(['name' => '벤치프레스', 'category' => '가슴', 'is_default' => true]);
        $log      = WorkoutLog::create(['user_id' => $user->id, 'record_date' => '2026-08-13']);

        foreach ([[1, 60], [2, 62.5]] as [$number, $weight]) {
            WorkoutSet::create([
                'workout_log_id' => $log->id,
                'exercise_id'    => $exercise->id,
                'set_number'     => $number,
                'reps'           => 10,
                'weight'         => $weight,
            ]);
        }

        $sets = $this->actingAs($user)
            ->getJson('/api/workout-logs/2026-08-13')
            ->assertStatus(200)
            ->json('sets');

        // MySQL 드라이버는 decimal(5,2)를 "60.00" 문자열로 준다. 로컬 SQLite는
        // 60을 주므로 같은 세트가 60.00kg / 60kg으로 갈려 보였다.
        // (JSON은 60.0을 60으로 직렬화하므로 float 타입까지 요구할 수는 없다)
        $this->assertIsNotString($sets[0]['weight']);
        $this->assertEquals(60, $sets[0]['weight']);

        $this->assertIsNotString($sets[1]['weight']);
        $this->assertSame(62.5, $sets[1]['weight']);
    }

    public function test_log_response_keeps_the_fields_the_app_reads(): void
    {
        $user     = User::factory()->create();
        $exercise = Exercise::create(['name' => '벤치프레스', 'category' => '가슴', 'is_default' => true]);
        $log      = WorkoutLog::create(['user_id' => $user->id, 'record_date' => '2026-08-13', 'memo' => '메모']);

        WorkoutSet::create([
            'workout_log_id' => $log->id,
            'exercise_id'    => $exercise->id,
            'set_number'     => 1,
            'reps'           => 10,
            'weight'         => 60,
        ]);

        // 모바일의 reconcileServerLog와 LogScreen이 읽는 필드들이다.
        $this->actingAs($user)
            ->getJson('/api/workout-logs/2026-08-13')
            ->assertStatus(200)
            ->assertJsonStructure([
                'id', 'record_date', 'memo',
                'sets' => [['id', 'exercise_id', 'set_number', 'reps', 'weight', 'exercise' => ['id', 'name', 'category']]],
            ]);
    }

    public function test_exercise_list_keeps_is_default_flag(): void
    {
        $user = User::factory()->create();
        Exercise::create(['name' => '벤치프레스', 'category' => '가슴', 'is_default' => true]);

        $this->actingAs($user)
            ->getJson('/api/exercises')
            ->assertStatus(200)
            ->assertJsonStructure([['id', 'name', 'category', 'is_default']]);
    }
}
