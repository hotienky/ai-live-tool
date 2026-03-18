<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name', 'phone', 'email', 'address', 'tax_id',
        'contact_person', 'payment_terms', 'notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'payment_terms' => 'integer',
    ];

    public function stockReceipts()
    {
        return $this->hasMany(StockReceipt::class);
    }
}
