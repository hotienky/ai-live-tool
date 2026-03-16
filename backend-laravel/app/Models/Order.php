<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'order_number', 'customer_id', 'customer_name', 'customer_email',
        'customer_phone', 'customer_address', 'items', 'total_amount',
        'discount_amount', 'shipping_fee', 'coupon_code', 'status', 'payment_status',
        'payment_method', 'note', 'tracking_number', 'shop_id',
        'shipping_provider', 'shipping_service', 'shipping_tracking',
        'to_province_id', 'to_district_id', 'to_ward_code',
    ];

    protected $casts = [
        'items' => 'array',
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'to_province_id' => 'integer',
        'to_district_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /* Relationships */
    public function details()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function customer()
    {
        return $this->belongsTo(ShopCustomer::class, 'customer_id');
    }

    /* Scopes */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPaymentStatus($query, string $status)
    {
        return $query->where('payment_status', $status);
    }

    public function scopeDateRange($query, $from, $to)
    {
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to);
        return $query;
    }

    public function scopeByCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    /* Status validation (B25) */
    public const STATUS_FLOW = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['shipping', 'cancelled'],
        'shipping' => ['delivered', 'returned'],
        'delivered' => ['returned'],
        'cancelled' => [],
        'returned' => [],
    ];

    public function canTransitionTo(string $newStatus): bool
    {
        $allowed = self::STATUS_FLOW[$this->status] ?? [];
        return in_array($newStatus, $allowed);
    }
}
