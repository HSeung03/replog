<?php

namespace App\Policies;

use App\Models\BodyRecord;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BodyRecordPolicy
{
    public function update(User $user, BodyRecord $record): Response
    {
        return $this->owns($user, $record);
    }

    public function delete(User $user, BodyRecord $record): Response
    {
        return $this->owns($user, $record);
    }

    private function owns(User $user, BodyRecord $record): Response
    {
        return $record->user_id === $user->id
            ? Response::allow()
            : Response::deny('권한이 없습니다.');
    }
}
