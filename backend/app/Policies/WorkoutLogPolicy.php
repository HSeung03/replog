<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkoutLog;
use Illuminate\Auth\Access\Response;

class WorkoutLogPolicy
{
    public function view(User $user, WorkoutLog $log): Response
    {
        return $this->owns($user, $log);
    }

    public function update(User $user, WorkoutLog $log): Response
    {
        return $this->owns($user, $log);
    }

    public function delete(User $user, WorkoutLog $log): Response
    {
        return $this->owns($user, $log);
    }

    private function owns(User $user, WorkoutLog $log): Response
    {
        return $log->user_id === $user->id
            ? Response::allow()
            : Response::deny('권한이 없습니다.');
    }
}
