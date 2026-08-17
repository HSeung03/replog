<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'category'   => $this->category,
            'is_default' => (bool) $this->is_default,

            // 템플릿에 실려 나온 경우에만 붙는다. 종목 목록 조회에는 나오지 않는다.
            'sort_order'  => $this->whenPivotLoaded('template_exercises', fn () => $this->pivot->sort_order),
            'target_sets' => $this->whenPivotLoaded('template_exercises', fn () => $this->pivot->target_sets),
            'target_reps' => $this->whenPivotLoaded('template_exercises', fn () => $this->pivot->target_reps),
        ];
    }
}
