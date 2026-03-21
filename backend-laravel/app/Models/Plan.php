<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $connection = 'master';
    
    protected $fillable = [
        'name', 'slug', 'price', 'billing_cycle', 
        'limits', 'features', 'is_active', 'sort_order'
    ];

    protected $casts = [
        'limits' => 'array',
        'features' => 'array',
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
