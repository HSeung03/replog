<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class Exercise extends Model
{
    protected $fillable = ['name', 'category', 'is_default', 'user_id'];

    protected $casts = ['is_default' => 'boolean'];

    /*
     * exercise_id를 받는 곳에서 쓰는 검증 규칙.
     *
     * exists:exercises,id만 걸면 "존재하는 ID"까지만 확인하므로 남의 커스텀
     * 종목 ID를 끼워넣을 수 있고, 응답의 load('exercise')에 그 이름이 실려
     * 돌아온다. index()가 is_default OR user_id로 거르는 것과 같은 조건을
     * 규칙 안에 넣어 조회와 쓰기 경로의 가시 범위를 일치시킨다.
     */
    public static function accessibleRule(int $userId): Exists
    {
        return Rule::exists('exercises', 'id')->where(function ($query) use ($userId) {
            // 괄호로 묶지 않으면 exists가 붙이는 id 조건과 OR가 뒤엉킨다.
            $query->where(function ($q) use ($userId) {
                $q->where('is_default', true)->orWhere('user_id', $userId);
            });
        });
    }

    // 이 종목으로 기록된 세트들
    public function workoutSets()
    {
        return $this->hasMany(WorkoutSet::class);
    }

    // 이 종목이 포함된 템플릿들
    public function templates()
    {
        return $this->belongsToMany(WorkoutTemplate::class, 'template_exercises', 'exercise_id', 'template_id')
                    ->withPivot('sort_order')
                    ->withTimestamps();
    }
}
