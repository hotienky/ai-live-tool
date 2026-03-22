<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalonAppointment extends Model
{
    protected $fillable = [
        'service_id', 'staff_id', 'customer_name', 'customer_phone', 'customer_email',
        'date', 'time_slot', 'status', 'notes',
        'confirmed_at', 'completed_at', 'total_price', 'reminder_sent',
    ];

    protected $casts = [
        'date' => 'date',
        'confirmed_at' => 'datetime',
        'completed_at' => 'datetime',
        'total_price' => 'decimal:2',
        'reminder_sent' => 'boolean',
    ];

    public function service()
    {
        return $this->belongsTo(SalonService::class, 'service_id');
    }

    public function staff()
    {
        return $this->belongsTo(SalonStaff::class, 'staff_id');
    }
}
