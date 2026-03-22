<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalonStaff extends Model
{
    protected $table = 'salon_staff';

    protected $fillable = [
        'name', 'phone', 'email', 'avatar', 'specialties', 'is_active', 'working_hours',
    ];

    protected $casts = [
        'specialties' => 'array',
        'working_hours' => 'array',
        'is_active' => 'boolean',
    ];

    public function appointments()
    {
        return $this->hasMany(SalonAppointment::class, 'staff_id');
    }

    public function services()
    {
        return $this->belongsToMany(SalonService::class, 'salon_service_staff', 'staff_id', 'service_id');
    }
}
