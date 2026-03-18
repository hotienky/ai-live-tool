<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockReceipt extends Model
{
    protected $table = 'stock_receipts';

    protected $fillable = [
        'receipt_number', 'type', 'supplier_id', 'items',
        'total_amount', 'tax_amount', 'discount_amount',
        'status', 'notes', 'reference_type', 'reference_id',
        'confirmed_at', 'confirmed_by', 'created_by',
    ];

    protected $casts = [
        'items' => 'array',
        'total_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    /* Relations */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /* Scopes */
    public function scopeImport($query) { return $query->where('type', 'import'); }
    public function scopeExport($query) { return $query->where('type', 'export'); }
    public function scopeConfirmed($query) { return $query->where('status', 'confirmed'); }
    public function scopeDraft($query) { return $query->where('status', 'draft'); }

    public function scopeDateRange($query, $from, $to)
    {
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to . ' 23:59:59');
        return $query;
    }

    /* Auto-generate receipt number */
    public static function generateNumber(string $type = 'import'): string
    {
        $prefix = match ($type) {
            'import' => 'NK',
            'export' => 'XK',
            'return' => 'TH',
            'adjust' => 'KK',
            default => 'PK',
        };
        $date = now()->format('ymd');
        $last = static::where('receipt_number', 'like', "{$prefix}{$date}%")
            ->orderByDesc('receipt_number')
            ->value('receipt_number');
        $seq = $last ? (int) substr($last, -4) + 1 : 1;
        return $prefix . $date . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
