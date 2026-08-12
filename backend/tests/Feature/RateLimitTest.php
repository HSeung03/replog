<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_throttled_after_repeated_failures(): void
    {
        User::factory()->create(['email' => 'victim@example.com']);

        // 이메일+IP 리미터가 분당 5회를 허용한다.
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email'    => 'victim@example.com',
                'password' => "guess-{$i}",
            ])->assertStatus(422);
        }

        $this->postJson('/api/login', [
            'email'    => 'victim@example.com',
            'password' => 'guess-6',
        ])->assertStatus(429);
    }

    public function test_throttled_login_stays_blocked_even_with_the_correct_password(): void
    {
        User::factory()->create([
            'email'    => 'victim@example.com',
            'password' => 'correct-horse-battery-staple',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email'    => 'victim@example.com',
                'password' => "guess-{$i}",
            ]);
        }

        // 한도를 소진한 뒤에는 정답을 넣어도 토큰이 발급되지 않아야 한다.
        $response = $this->postJson('/api/login', [
            'email'    => 'victim@example.com',
            'password' => 'correct-horse-battery-staple',
        ]);

        $response->assertStatus(429);
        $response->assertJsonMissingPath('token');
    }

    public function test_other_accounts_are_not_locked_out_by_one_targeted_email(): void
    {
        User::factory()->create(['email' => 'victim@example.com']);
        User::factory()->create([
            'email'    => 'bystander@example.com',
            'password' => 'correct-horse-battery-staple',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email'    => 'victim@example.com',
                'password' => "guess-{$i}",
            ]);
        }

        // 이메일 단위 한도가 소진돼도 다른 계정은 IP 한도(20회) 안에서 계속 로그인된다.
        $this->postJson('/api/login', [
            'email'    => 'bystander@example.com',
            'password' => 'correct-horse-battery-staple',
        ])->assertStatus(200)->assertJsonStructure(['token']);
    }

    public function test_registration_is_throttled_per_ip(): void
    {
        // 이메일이 매번 달라 이메일 리미터에는 걸리지 않고, IP 한도(20회)에서 걸린다.
        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/register', [
                'name'                  => "사용자{$i}",
                'email'                 => "bulk{$i}@example.com",
                'password'              => 'password123',
                'password_confirmation' => 'password123',
            ])->assertStatus(201);
        }

        $this->postJson('/api/register', [
            'name'                  => '사용자21',
            'email'                 => 'bulk21@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(429);

        $this->assertDatabaseMissing('users', ['email' => 'bulk21@example.com']);
    }

    public function test_google_login_is_throttled_per_ip(): void
    {
        Http::fake([
            'https://www.googleapis.com/oauth2/v3/tokeninfo*' => Http::response(['error' => 'invalid_token'], 400),
        ]);

        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/auth/google', ['id_token' => "forged-{$i}"])
                ->assertStatus(401);
        }

        $this->postJson('/api/auth/google', ['id_token' => 'forged-21'])
            ->assertStatus(429);
    }

    public function test_authenticated_api_routes_carry_a_rate_limit(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/exercises');

        $response->assertStatus(200);
        $response->assertHeader('X-RateLimit-Limit', '120');
    }
}
