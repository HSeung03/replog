<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/*
 * 모델을 그대로 반환하면 /api/me와 로그인 응답에 google_id,
 * email_verified_at, 타임스탬프까지 실려 나간다. 클라이언트가 쓰는 건
 * id·name·email 셋뿐이다.
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'    => $this->id,
            'name'  => $this->name,
            'email' => $this->email,
        ];
    }
}
