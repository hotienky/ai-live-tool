<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingService extends Model
{
    protected $fillable = [
        'title', 'description', 'duration_minutes', 'buffer_minutes', 'price',
        'is_active', 'image', 'sort_order', 'category', 'working_hours', 'max_bookings_per_slot',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'working_hours' => 'array',
    ];

    public function appointments()
    {
        return $this->hasMany(BookingAppointment::class, 'service_id');
    }
}
