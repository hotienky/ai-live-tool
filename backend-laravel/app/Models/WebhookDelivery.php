<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookDelivery extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'payload' => 'array',
        'success' => 'boolean',
        'delivered_at' => 'datetime',
    ];

    public function webhook()
    {
        return $this->belongsTo(Webhook::class);
    }
}
