<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutTemplate extends Model
{
    protected $fillable = ['user_id', 'name'];

    // 이 템플릿에 포함된 종목들 (순서 포함)
    public function exercises()
    {
        return $this->belongsToMany(Exercise::class, 'template_exercises', 'template_id', 'exercise_id')
                    ->withPivot('sort_order')
                    ->orderBy('template_exercises.sort_order')
                    ->withTimestamps();
    }

    // 이 템플릿의 주인
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
