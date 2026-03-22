<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalonService extends Model
{
    protected $fillable = [
        'name', 'description', 'duration_minutes', 'price', 'category', 'image',
        'is_active', 'is_popular', 'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_popular' => 'boolean',
    ];

    public function appointments()
    {
        return $this->hasMany(SalonAppointment::class, 'service_id');
    }

    public function staff()
    {
        return $this->belongsToMany(SalonStaff::class, 'salon_service_staff', 'service_id', 'staff_id');
    }
}
