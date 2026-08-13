<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkoutTemplate;
use Illuminate\Auth\Access\Response;

class WorkoutTemplatePolicy
{
    public function view(User $user, WorkoutTemplate $template): Response
    {
        return $this->owns($user, $template);
    }

    public function update(User $user, WorkoutTemplate $template): Response
    {
        return $this->owns($user, $template);
    }

    public function delete(User $user, WorkoutTemplate $template): Response
    {
        return $this->owns($user, $template);
    }

    private function owns(User $user, WorkoutTemplate $template): Response
    {
        return $template->user_id === $user->id
            ? Response::allow()
            : Response::deny('권한이 없습니다.');
    }
}
