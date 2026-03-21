<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsageRecord extends Model
{
    protected $connection = 'master';
    public $timestamps = true;

    protected $fillable = [
        'tenant_id', 'metric', 'value', 'recorded_at'
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];
}
