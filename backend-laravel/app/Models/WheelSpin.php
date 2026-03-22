<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WheelSpin extends Model
{
    protected $fillable = [
        'wheel_id', 'prize_id', 'customer_name', 'customer_phone', 'customer_email',
        'ip_address', 'is_redeemed', 'redeemed_at', 'won_at',
    ];

    protected $casts = [
        'won_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'is_redeemed' => 'boolean',
    ];

    public function wheel()
    {
        return $this->belongsTo(LuckyWheel::class, 'wheel_id');
    }

    public function prize()
    {
        return $this->belongsTo(WheelPrize::class, 'prize_id');
    }
}
