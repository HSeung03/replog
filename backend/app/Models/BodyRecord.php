<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BodyRecord extends Model
{
    protected $fillable = ['user_id', 'measured_at', 'weight', 'muscle_mass', 'body_fat'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
