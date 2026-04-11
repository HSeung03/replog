<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutLog extends Model
{
    protected $fillable = ['user_id', 'record_date', 'memo'];

    // 이 일지에 속한 세트들
    public function sets()
    {
        return $this->hasMany(WorkoutSet::class);
    }

    // 이 일지의 주인
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
