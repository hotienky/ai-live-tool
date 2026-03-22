<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'category_id', 'name', 'description', 'price', 'original_price', 'image',
        'is_available', 'is_popular', 'allergens', 'sort_order',
        'variants', 'preparation_time', 'spice_level',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_popular' => 'boolean',
        'allergens' => 'array',
        'variants' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }
}
