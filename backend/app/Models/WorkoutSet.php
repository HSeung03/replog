<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutSet extends Model
{
    protected $fillable = ['workout_log_id', 'exercise_id', 'set_number', 'reps', 'weight'];

    // decimal 컬럼은 드라이버가 문자열로 준다("60.00"). 모델에서도 숫자로 다룬다.
    protected $casts = [
        'set_number' => 'integer',
        'reps'       => 'integer',
        'weight'     => 'float',
    ];

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
