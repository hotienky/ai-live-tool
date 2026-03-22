<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class RestaurantTable extends Model
{
    protected $fillable = ['number', 'capacity', 'location', 'is_available', 'sort_order'];
    protected $casts = ['is_available' => 'boolean'];
}
