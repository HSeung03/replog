<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    protected $fillable = ['name', 'category', 'is_default', 'user_id'];

    // 이 종목으로 기록된 세트들
    public function workoutSets()
    {
        return $this->hasMany(WorkoutSet::class);
    }

    // 이 종목이 포함된 템플릿들
    public function templates()
    {
        return $this->belongsToMany(WorkoutTemplate::class, 'template_exercises')
                    ->withPivot('sort_order')
                    ->withTimestamps();
    }
}
