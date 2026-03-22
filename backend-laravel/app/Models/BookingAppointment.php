<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingAppointment extends Model
{
    protected $fillable = [
        'service_id', 'customer_name', 'customer_phone', 'customer_email',
        'date', 'time_slot', 'status', 'notes',
        'confirmed_at', 'cancelled_at', 'cancellation_reason', 'reminder_sent', 'total_price',
    ];

    protected $casts = [
        'date' => 'date',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'reminder_sent' => 'boolean',
        'total_price' => 'decimal:2',
    ];

    public function service()
    {
        return $this->belongsTo(BookingService::class, 'service_id');
    }
}
