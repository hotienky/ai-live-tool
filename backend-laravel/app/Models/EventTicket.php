<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class EventTicket extends Model
{
    protected $fillable = ['event_id', 'name', 'price', 'quantity', 'sold_count', 'description', 'is_active'];
    protected $casts = ['price' => 'decimal:2', 'is_active' => 'boolean'];
}
