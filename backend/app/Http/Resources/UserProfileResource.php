<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'birth_date'           => $this->birth_date?->toDateString(),
            // 나이는 컬럼이 아니라 계산값이다. 클라이언트가 또 계산하지 않도록 함께 내려준다.
            'age'                  => $this->age(),
            'gender'               => $this->gender,
            'height'               => $this->height !== null ? (float) $this->height : null,
            'goal'                 => $this->goal,
            'activity_level'       => $this->activity_level,
            'experience_level'     => $this->experience_level,
            'weekly_workout_days'  => $this->weekly_workout_days,
            'dietary_restrictions' => $this->dietary_restrictions ?? [],
        ];
    }
}
