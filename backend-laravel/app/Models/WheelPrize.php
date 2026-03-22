<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WheelPrize extends Model
{
    protected $fillable = [
        'wheel_id', 'label', 'probability', 'prize_type', 'prize_value', 'color', 'sort_order',
        'stock', 'redeemed_count',
    ];

    protected $casts = [
        'probability' => 'decimal:2',
    ];

    public function wheel()
    {
        return $this->belongsTo(LuckyWheel::class, 'wheel_id');
    }
}
