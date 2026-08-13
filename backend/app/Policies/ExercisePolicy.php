<?php

namespace App\Policies;

use App\Models\Exercise;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ExercisePolicy
{
    /*
     * 기본 종목은 누구의 것도 아니므로 아무도 지울 수 없다.
     * 커스텀 종목은 만든 사람만 지운다.
     */
    public function delete(User $user, Exercise $exercise): Response
    {
        return !$exercise->is_default && $exercise->user_id === $user->id
            ? Response::allow()
            : Response::deny('삭제할 수 없는 종목입니다.');
    }
}
