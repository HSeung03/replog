<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BodyRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'measured_at' => $this->measured_at,
            'weight'      => (float) $this->weight,
            'muscle_mass' => (float) $this->muscle_mass,
            'body_fat'    => (float) $this->body_fat,
        ];
    }
}
