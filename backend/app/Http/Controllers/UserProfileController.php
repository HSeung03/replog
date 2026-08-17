<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserProfileResource;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/*
 * 내 프로필 조회 / 저장.
 *
 * Policy가 없는 것은 빠뜨린 게 아니다. 이 컨트롤러는 라우트 모델 바인딩으로
 * 남의 행을 받을 일이 없고 언제나 $request->user()에 매달린 한 행만 만진다.
 * 검사할 소유권이 애초에 생기지 않는다.
 */
class UserProfileController extends Controller
{
    // 프로필 조회. 아직 안 쓴 사용자는 null이 온다(빈 객체가 아니다).
    public function show(Request $request)
    {
        $profile = $request->user()->profile;

        return response()->json($profile ? UserProfileResource::make($profile) : null);
    }

    /*
     * 저장. 생성과 수정을 나누지 않고 upsert 하나로 둔다.
     * 클라이언트가 "내 프로필이 이미 있는지" 먼저 물어본 뒤 POST와 PATCH를
     * 갈라 쓰게 만들면, 그 판단이 틀렸을 때 409나 중복 행으로 돌아온다.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            // 미래 생년월일과 비현실적인 나이를 막는다.
            'birth_date'           => ['sometimes', 'nullable', 'date', 'before:today', 'after:1900-01-01'],
            'gender'               => ['sometimes', 'nullable', Rule::in(UserProfile::GENDERS)],
            'height'               => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:'.UserProfile::MAX_HEIGHT],
            'goal'                 => ['sometimes', 'nullable', Rule::in(UserProfile::GOALS)],
            'activity_level'       => ['sometimes', 'nullable', Rule::in(UserProfile::ACTIVITY_LEVELS)],
            'experience_level'     => ['sometimes', 'nullable', Rule::in(UserProfile::EXPERIENCE_LEVELS)],
            'weekly_workout_days'  => ['sometimes', 'nullable', 'integer', 'min:0', 'max:7'],
            'dietary_restrictions' => ['sometimes', 'nullable', 'array', 'max:20'],
            'dietary_restrictions.*' => ['string', 'max:50'],
        ]);

        $profile = UserProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json(UserProfileResource::make($profile));
    }
}
