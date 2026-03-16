<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $table = 'leads';

    protected $fillable = [
        'name', 'email', 'phone', 'message', 'source',
        'status', 'customer_id', 'assigned_to', 'note',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /* Relationships */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /* Scopes */
    public function scopeNew($query)
    {
        return $query->where('status', 'new');
    }

    public function scopeBySource($query, $source)
    {
        return $query->where('source', $source);
    }
}
