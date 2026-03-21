<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Webhook extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'event_types' => 'array',
    ];

    protected $hidden = ['secret'];

    public function deliveries()
    {
        return $this->hasMany(WebhookDelivery::class)->latest();
    }
}
