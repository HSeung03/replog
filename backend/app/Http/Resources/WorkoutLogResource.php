<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'record_date' => $this->record_date,
            'memo'        => $this->memo,
            'sets'        => WorkoutSetResource::collection($this->whenLoaded('sets')),
        ];
    }
}
