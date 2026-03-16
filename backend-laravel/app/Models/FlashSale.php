<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class FlashSale extends Model
{
    protected $table = 'flash_sales';

    protected $fillable = [
        'name', 'start_time', 'end_time', 'is_active',
        'discount_type', 'discount_value', 'products',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'products' => 'array',
        'discount_value' => 'decimal:2',
    ];

    /* Scopes */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRunning($query)
    {
        return $query->active()
                     ->where('start_time', '<=', now())
                     ->where('end_time', '>=', now());
    }

    public function scopeUpcoming($query)
    {
        return $query->active()
                     ->where('start_time', '>', now());
    }

    /* Helpers */
    public function isRunning(): bool
    {
        return $this->is_active
            && $this->start_time <= now()
            && $this->end_time >= now();
    }
}
