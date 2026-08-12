<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    private const ALLOWED_AUD = 'allowed-client-id.apps.googleusercontent.com';
    private const TOKENINFO   = 'https://www.googleapis.com/oauth2/v3/tokeninfo*';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.allowed_audiences' => [self::ALLOWED_AUD]]);
    }

    /** tokeninfo 응답을 흉내낸다. 불리언이 문자열로 오는 것까지 실제 응답과 맞춤. */
    private function fakeTokenInfo(array $overrides = []): void
    {
        Http::fake([
            self::TOKENINFO => Http::response(array_merge([
                'iss'            => 'https://accounts.google.com',
                'aud'            => self::ALLOWED_AUD,
                'sub'            => '1234567890',
                'email'          => 'user@example.com',
                'email_verified' => 'true',
                'name'           => '이승혁',
            ], $overrides), 200),
        ]);
    }

    public function test_valid_id_token_logs_in_and_creates_user(): void
    {
        $this->fakeTokenInfo();

        $response = $this->postJson('/api/auth/google', ['id_token' => 'valid-token']);

        $response->assertStatus(200)->assertJsonStructure(['token', 'user']);
        $this->assertDatabaseHas('users', [
            'email'     => 'user@example.com',
            'google_id' => '1234567890',
        ]);
    }

    public function test_rejects_token_issued_for_another_app(): void
    {
        $this->fakeTokenInfo(['aud' => 'attacker-client-id.apps.googleusercontent.com']);

        $response = $this->postJson('/api/auth/google', ['id_token' => 'foreign-app-token']);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('users', ['email' => 'user@example.com']);
    }

    public function test_rejects_token_with_unexpected_issuer(): void
    {
        $this->fakeTokenInfo(['iss' => 'https://evil.example.com']);

        $this->postJson('/api/auth/google', ['id_token' => 'bad-iss-token'])
            ->assertStatus(401);
    }

    public function test_rejects_unverified_email(): void
    {
        $this->fakeTokenInfo(['email_verified' => 'false']);

        $response = $this->postJson('/api/auth/google', ['id_token' => 'unverified-token']);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('users', ['email' => 'user@example.com']);
    }

    public function test_unverified_email_cannot_hijack_existing_password_account(): void
    {
        $victim = User::factory()->create([
            'email'    => 'victim@example.com',
            'password' => Hash::make('correct-horse-battery-staple'),
        ]);

        $this->fakeTokenInfo([
            'email'          => 'victim@example.com',
            'email_verified' => 'false',
            'sub'            => 'attacker-sub',
        ]);

        $response = $this->postJson('/api/auth/google', ['id_token' => 'hijack-token']);

        $response->assertStatus(401);
        $this->assertNull($victim->fresh()->google_id);
    }

    public function test_rejects_when_no_allowed_audiences_configured(): void
    {
        config(['services.google.allowed_audiences' => []]);
        $this->fakeTokenInfo();

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertStatus(401);
    }

    public function test_rejects_when_tokeninfo_rejects_the_token(): void
    {
        Http::fake([self::TOKENINFO => Http::response(['error' => 'invalid_token'], 400)]);

        $this->postJson('/api/auth/google', ['id_token' => 'garbage'])
            ->assertStatus(401);
    }

    public function test_id_token_is_required(): void
    {
        $this->postJson('/api/auth/google', [])->assertStatus(422);
    }

    public function test_verified_google_email_links_to_existing_account(): void
    {
        $user = User::factory()->create(['email' => 'user@example.com', 'google_id' => null]);

        $this->fakeTokenInfo();

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertStatus(200);

        $this->assertSame('1234567890', $user->fresh()->google_id);
    }
}
