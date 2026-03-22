<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    protected $fillable = [
        'customer_id', 'tier_id', 'name', 'email', 'phone',
        'points', 'total_spent', 'joined_at', 'expires_at', 'status',
        'referral_code', 'referred_by', 'points_earned_total', 'points_redeemed_total', 'birthday',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'joined_at' => 'datetime',
        'expires_at' => 'datetime',
        'birthday' => 'date',
    ];

    public function tier()
    {
        return $this->belongsTo(MembershipTier::class, 'tier_id');
    }

    public function transactions()
    {
        return $this->hasMany(PointsTransaction::class)->orderBy('created_at', 'desc');
    }
}
