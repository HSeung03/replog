<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/*
 * weight는 decimal(5,2)라 MySQL 드라이버가 "60.00" 문자열로 준다.
 * 로컬 SQLite는 60을 주므로, 같은 세트가 화면에서 60.00kg과 60kg으로
 * 갈려 보였다. 여기서 숫자로 못박는다.
 */
class WorkoutSetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'workout_log_id' => $this->workout_log_id,
            'exercise_id'    => $this->exercise_id,
            'set_number'     => (int) $this->set_number,
            'reps'           => (int) $this->reps,
            'weight'         => (float) $this->weight,
            'exercise'       => ExerciseResource::make($this->whenLoaded('exercise')),
        ];
    }
}
