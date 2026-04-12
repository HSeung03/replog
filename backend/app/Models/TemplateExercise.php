<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateExercise extends Model
{
    protected $fillable = ['template_id', 'exercise_id', 'sort_order'];

    public function template()
    {
        return $this->belongsTo(WorkoutTemplate::class);
    }

    public function exercise()
    {
        return $this->belongsTo(Exercise::class);
    }
}
