<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

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
            'user'    => $user,
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
            'user'    => $user,
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
        return response()->json($request->user());
    }

    // 모바일 구글 로그인 (id_token 방식)
    public function googleLogin(Request $request)
    {
        $request->validate(['id_token' => 'required|string']);

        try {
            $response = \Illuminate\Support\Facades\Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $request->id_token,
            ]);

            if (!$response->ok()) {
                return response()->json(['message' => '구글 로그인 실패'], 401);
            }

            $googleUser = $response->json();

            $user = User::updateOrCreate(
                ['google_id' => $googleUser['sub']],
                [
                    'name'  => $googleUser['name'] ?? $googleUser['email'],
                    'email' => $googleUser['email'],
                ]
            );

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => '로그인 성공',
                'token'   => $token,
                'user'    => $user,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => '구글 로그인 실패'], 401);
        }
    }

    // 구글 OAuth 리다이렉트
    public function googleRedirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // 구글 OAuth 콜백
    public function googleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name'              => $googleUser->getName(),
                    'google_id'         => $googleUser->getId(),
                    'password'          => Hash::make(str()->random(24)),
                ]
            );

            $token = $user->createToken('auth_token')->plainTextToken;

            return redirect(env('FRONTEND_URL', 'http://localhost:5174') . '/?token=' . $token);
        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL', 'http://localhost:5174') . '/login?error=oauth_failed');
        }
    }
}
