<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_프로필을_쓰지_않은_사용자는_null을_받는다(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/profile')
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_프로필을_저장하고_다시_읽는다(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'birth_date'           => '1999-03-02',
                'gender'               => 'male',
                'height'               => 174.5,
                'goal'                 => 'gain_muscle',
                'activity_level'       => 'moderate',
                'experience_level'     => 'intermediate',
                'weekly_workout_days'  => 4,
                'dietary_restrictions' => ['새우', '유당불내증'],
            ])
            ->assertOk()
            ->assertJsonPath('height', 174.5)
            ->assertJsonPath('goal', 'gain_muscle')
            ->assertJsonPath('dietary_restrictions.1', '유당불내증');

        $this->assertDatabaseCount('user_profiles', 1);
    }

    public function test_두_번_저장해도_행이_늘지_않는다(): void
    {
        $this->actingAs($this->user)->putJson('/api/profile', ['goal' => 'lose_fat'])->assertOk();
        $this->actingAs($this->user)->putJson('/api/profile', ['goal' => 'strength'])->assertOk();

        $this->assertDatabaseCount('user_profiles', 1);
        $this->assertSame('strength', $this->user->fresh()->profile->goal);
    }

    public function test_나이는_저장하지_않고_생년월일에서_계산한다(): void
    {
        $birth = now()->subYears(27)->subDays(3)->toDateString();

        $this->actingAs($this->user)
            ->putJson('/api/profile', ['birth_date' => $birth])
            ->assertOk()
            ->assertJsonPath('age', 27);

        $this->assertArrayNotHasKey('age', UserProfile::first()->getAttributes());
    }

    public function test_목록에_없는_값은_거부한다(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', ['goal' => '벌크업'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('goal');
    }

    /*
     * height는 decimal(5, 2)라 999.99가 상한이다. 검증이 이보다 넓으면
     * 저장 단계에서 500이 난다(BodyRecord에서 실제로 겪었던 실패).
     */
    public function test_컬럼_상한을_넘는_키는_422로_막힌다(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', ['height' => 1000])
            ->assertStatus(422)
            ->assertJsonValidationErrors('height');
    }

    public function test_미래_생년월일은_거부한다(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', ['birth_date' => now()->addDay()->toDateString()])
            ->assertStatus(422)
            ->assertJsonValidationErrors('birth_date');
    }

    public function test_남의_프로필은_보이지_않는다(): void
    {
        $other = User::factory()->create();
        UserProfile::create(['user_id' => $other->id, 'goal' => 'strength', 'height' => 180]);

        $this->actingAs($this->user)
            ->getJson('/api/profile')
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_비로그인은_401(): void
    {
        $this->getJson('/api/profile')->assertStatus(401);
        $this->putJson('/api/profile', ['goal' => 'maintain'])->assertStatus(401);
    }
}
