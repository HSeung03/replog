<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutSet extends Model
{
    protected $fillable = ['workout_log_id', 'exercise_id', 'set_number', 'reps', 'weight'];

    // 이 세트가 속한 일지
    public function log()
    {
        return $this->belongsTo(WorkoutLog::class);
    }

    // 이 세트의 운동 종목
    public function exercise()
    {
        return $this->belongsTo(Exercise::class);
    }
}
