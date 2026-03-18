<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingEntry extends Model
{
    protected $table = 'accounting_entries';

    protected $fillable = [
        'type', 'category', 'amount', 'tax_amount',
        'description', 'reference_type', 'reference_id',
        'entry_date', 'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'entry_date' => 'date',
    ];

    /* Scopes */
    public function scopeRevenue($query) { return $query->where('type', 'revenue'); }
    public function scopeExpense($query) { return $query->where('type', 'expense'); }
    public function scopeAdjustment($query) { return $query->where('type', 'adjustment'); }

    public function scopeDateRange($query, $from, $to)
    {
        if ($from) $query->where('entry_date', '>=', $from);
        if ($to) $query->where('entry_date', '<=', $to);
        return $query;
    }

    public function scopeCategory($query, $cat)
    {
        return $query->where('category', $cat);
    }
}
