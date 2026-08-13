<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // 회원가입
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => '회원가입 성공',
            'token'   => $token,
            'user'    => UserResource::make($user),
        ], 201);
    }

    // 로그인
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['이메일 또는 비밀번호가 올바르지 않습니다.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => '로그인 성공',
            'token'   => $token,
            'user'    => UserResource::make($user),
        ]);
    }

    // 로그아웃
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => '로그아웃 성공']);
    }

    // 로그인 유저 정보
    public function me(Request $request)
    {
        return response()->json(UserResource::make($request->user()));
    }

    // 모바일 구글 로그인 (id_token 방식)
    public function googleLogin(Request $request)
    {
        $request->validate(['id_token' => 'required|string']);

        try {
            $response = Http::get('https://www.googleapis.com/oauth2/v3/tokeninfo', [
                'id_token' => $request->id_token,
            ]);

            if (!$response->ok()) {
                Log::error('Google tokeninfo failed', ['status' => $response->status(), 'body' => $response->body()]);
                return response()->json(['message' => '구글 로그인 실패'], 401);
            }

            $googleUser = $response->json();

            if (empty($googleUser['sub']) || empty($googleUser['email'])) {
                return response()->json(['message' => '구글 로그인 실패'], 401);
            }

            // tokeninfo는 서명과 만료만 검증한다. aud를 직접 확인하지 않으면
            // 다른 구글 앱에서 발급받은 id_token으로도 로그인이 통과한다.
            $allowedAudiences = config('services.google.allowed_audiences', []);

            if (empty($allowedAudiences)) {
                Log::error('Google login rejected: services.google.allowed_audiences is empty');

                return response()->json(['message' => '구글 로그인 실패'], 401);
            }

            if (!in_array($googleUser['aud'] ?? '', $allowedAudiences, true)) {
                Log::warning('Google login rejected: unexpected aud', ['aud' => $googleUser['aud'] ?? null]);

                return response()->json(['message' => '구글 로그인 실패'], 401);
            }

            if (!in_array($googleUser['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true)) {
                Log::warning('Google login rejected: unexpected iss', ['iss' => $googleUser['iss'] ?? null]);

                return response()->json(['message' => '구글 로그인 실패'], 401);
            }

            // 이메일로 기존 계정을 찾아 연결하므로, 구글이 소유를 확인해 준
            // 이메일이 아니면 남의 계정에 붙을 수 있다. (tokeninfo는 문자열 "true"를 준다)
            if (!filter_var($googleUser['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                Log::warning('Google login rejected: email not verified', ['email' => $googleUser['email']]);

                return response()->json(['message' => '구글 로그인 실패'], 401);
            }

            $user = User::where('email', $googleUser['email'])->first();
            if ($user) {
                $user->update(['google_id' => $googleUser['sub']]);
            } else {
                $user = User::create([
                    'google_id' => $googleUser['sub'],
                    'name'      => $googleUser['name'] ?? $googleUser['email'],
                    'email'     => $googleUser['email'],
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => '로그인 성공',
                'token'   => $token,
                'user'    => UserResource::make($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Google login exception', ['message' => $e->getMessage()]);
            return response()->json(['message' => '구글 로그인 실패'], 401);
        }
    }
}
