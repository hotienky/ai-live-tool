<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';

    protected $fillable = [
        'invoice_number', 'order_id',
        'customer_name', 'customer_phone', 'customer_address', 'customer_email',
        'items', 'subtotal', 'tax_amount', 'tax_details',
        'discount_amount', 'shipping_fee', 'total_amount',
        'status', 'issued_at', 'due_date', 'notes',
    ];

    protected $casts = [
        'items' => 'array',
        'tax_details' => 'array',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'issued_at' => 'datetime',
        'due_date' => 'date',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /* Scopes */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDateRange($query, $from, $to)
    {
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to);
        return $query;
    }

    /**
     * Generate next invoice number: {PREFIX}-2026-00001
     */
    public static function generateNumber(string $prefix = 'INV'): string
    {
        $year = date('Y');
        $last = static::where('invoice_number', 'like', "{$prefix}-{$year}-%")
            ->orderByDesc('id')->first();
        $seq = 1;
        if ($last) {
            $parts = explode('-', $last->invoice_number);
            $seq = intval(end($parts)) + 1;
        }
        return sprintf("%s-%s-%05d", $prefix, $year, $seq);
    }
}
