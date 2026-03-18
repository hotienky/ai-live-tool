<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'po_number', 'supplier_id', 'items',
        'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
        'status', 'order_date', 'expected_date', 'received_date',
        'payment_status', 'notes', 'shipping_address', 'created_by',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'order_date' => 'date',
        'expected_date' => 'date',
        'received_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /* Scopes */
    public function scopePending($query) { return $query->whereIn('status', ['draft', 'ordered', 'partial']); }
    public function scopeCompleted($query) { return $query->where('status', 'received'); }

    /* Auto-generate PO number */
    public static function generateNumber(): string
    {
        $prefix = 'PO';
        $date = now()->format('ymd');
        $last = static::where('po_number', 'like', "{$prefix}{$date}%")
            ->orderByDesc('po_number')
            ->value('po_number');
        $seq = $last ? (int) substr($last, -4) + 1 : 1;
        return $prefix . $date . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
