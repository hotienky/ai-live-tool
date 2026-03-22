<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class RestaurantHour extends Model
{
    protected $fillable = ['day_of_week', 'open_time', 'close_time', 'last_reservation_time', 'is_closed'];
    protected $casts = ['is_closed' => 'boolean'];
}
