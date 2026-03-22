<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipTier extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'min_points', 'max_points', 'discount_percent',
        'points_multiplier', 'benefits', 'color', 'icon', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'benefits' => 'array',
        'discount_percent' => 'decimal:2',
        'points_multiplier' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function members()
    {
        return $this->hasMany(Member::class, 'tier_id');
    }
}
