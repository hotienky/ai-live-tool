<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $table = 'promotions';

    protected $fillable = [
        'name', 'code', 'type', 'value', 'min_order_amount',
        'max_discount', 'usage_limit', 'used_count',
        'start_date', 'end_date', 'is_active', 'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    /* Scopes */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeValid($query)
    {
        return $query->active()
                     ->where(function ($q) {
                         $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                     })
                     ->where(function ($q) {
                         $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                     })
                     ->where(function ($q) {
                         $q->whereNull('usage_limit')
                           ->orWhereColumn('used_count', '<', 'usage_limit');
                     });
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('code', $code);
    }
}
