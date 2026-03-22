<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    protected $fillable = ['event_id', 'ticket_id', 'name', 'email', 'phone', 'status', 'registration_code', 'checked_in_at', 'extra_info'];
    protected $casts = ['extra_info' => 'array', 'checked_in_at' => 'datetime'];

    public function ticket() { return $this->belongsTo(EventTicket::class, 'ticket_id'); }
}
