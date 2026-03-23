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

    protected $appends = ['name', 'quantity', 'description', 'winners_count'];

    public function getNameAttribute() { return $this->label; }
    public function getQuantityAttribute() { return $this->stock; }
    public function getDescriptionAttribute() { return $this->prize_value; }
    public function getWinnersCountAttribute() { return $this->redeemed_count; }

    public function wheel()
    {
        return $this->belongsTo(LuckyWheel::class, 'wheel_id');
    }
}
