<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentVoucher extends Model
{
    protected $fillable = [
        'voucher_number', 'type', 'amount', 'category',
        'description', 'payment_method', 'counterparty',
        'status', 'reference_type', 'reference_id',
        'voucher_date', 'confirmed_at', 'confirmed_by', 'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'voucher_date' => 'date',
        'confirmed_at' => 'datetime',
    ];

    /* Scopes */
    public function scopeReceipts($query) { return $query->where('type', 'receipt'); }
    public function scopePayments($query) { return $query->where('type', 'payment'); }
    public function scopeConfirmed($query) { return $query->where('status', 'confirmed'); }

    /* Auto-generate voucher number */
    public static function generateNumber(string $type = 'receipt'): string
    {
        $prefix = $type === 'receipt' ? 'PT' : 'PC'; // Phiếu thu / Phiếu chi
        $date = now()->format('ymd');
        $last = static::where('voucher_number', 'like', "{$prefix}{$date}%")
            ->orderByDesc('voucher_number')
            ->value('voucher_number');
        $seq = $last ? (int) substr($last, -4) + 1 : 1;
        return $prefix . $date . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
