<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiReport extends Model
{
    public const TYPES = ['summary', 'diet', 'routine'];

    public const STATUS_PENDING = 'pending';

    public const STATUS_DONE = 'done';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id', 'type', 'status', 'content', 'error',
        'period_start', 'period_end', 'model', 'input_tokens', 'output_tokens',
    ];

    protected $casts = [
        'content'      => 'array',
        'period_start' => 'date',
        'period_end'   => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
