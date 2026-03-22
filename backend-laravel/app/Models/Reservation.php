<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'customer_name', 'customer_phone', 'customer_email',
        'date', 'time', 'party_size', 'status', 'notes', 'table_number',
        'table_id', 'confirmation_code', 'source',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function table()
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }
}
