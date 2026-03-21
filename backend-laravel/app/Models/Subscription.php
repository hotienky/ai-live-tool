<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $connection = 'master';

    protected $fillable = [
        'tenant_id', 'plan_id', 'status', 'trial_ends_at',
        'current_period_start', 'current_period_end',
        'cancelled_at', 'payment_method'
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function invoices()
    {
        return $this->hasMany(BillingInvoice::class);
    }

    // Helper for active scope
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'trialing']);
    }
}
