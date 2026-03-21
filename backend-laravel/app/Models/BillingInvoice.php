<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillingInvoice extends Model
{
    protected $connection = 'master';

    protected $fillable = [
        'tenant_id', 'subscription_id', 'amount', 'status', 
        'payment_method', 'payment_ref', 'issued_at', 
        'paid_at', 'due_at', 'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'issued_at' => 'datetime',
        'paid_at' => 'datetime',
        'due_at' => 'datetime',
    ];

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
