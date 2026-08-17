<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/*
 * 선택지를 문자열 컬럼에 담되, 값의 목록은 이 모델 한 곳에만 둔다.
 * DB enum을 쓰면 항목 하나 추가에 마이그레이션이 필요하고, 검증 규칙을
 * 컨트롤러마다 적어 두면 화면과 API가 서로 다른 목록을 갖게 된다.
 */
class UserProfile extends Model
{
    public const GENDERS = ['male', 'female', 'other'];

    public const GOALS = ['lose_fat', 'maintain', 'gain_muscle', 'strength'];

    public const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

    public const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

    // user_profiles.height는 decimal(5, 2)이므로 999.99가 상한이다.
    // 검증이 컬럼보다 넓으면 저장 단계에서 500이 난다(BodyRecord에서 겪었다).
    public const MAX_HEIGHT = 999.99;

    protected $fillable = [
        'user_id', 'birth_date', 'gender', 'height', 'goal',
        'activity_level', 'experience_level', 'weekly_workout_days',
        'dietary_restrictions',
    ];

    protected $casts = [
        'birth_date'            => 'date',
        'height'                => 'float',
        'weekly_workout_days'   => 'integer',
        'dietary_restrictions'  => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /*
     * 나이는 저장하지 않고 생년월일에서 그때그때 센다.
     * 프로필을 쓴 지 2년 된 사용자의 나이가 조용히 두 살 틀리는 것을 막는다.
     */
    public function age(): ?int
    {
        return $this->birth_date?->age;
    }
}
