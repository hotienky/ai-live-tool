<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LuckyWheel extends Model
{
    protected $fillable = [
        'title', 'description', 'is_active', 'settings', 'flow_config', 'spin_count',
        'start_date', 'end_date', 'max_spins_per_user', 'require_login', 'background_image',
    ];

    protected $casts = [
        'settings' => 'array',
        'flow_config' => 'array',
        'is_active' => 'boolean',
        'require_login' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function prizes()
    {
        return $this->hasMany(WheelPrize::class, 'wheel_id')->orderBy('sort_order');
    }

    public function spins()
    {
        return $this->hasMany(WheelSpin::class, 'wheel_id');
    }
}
