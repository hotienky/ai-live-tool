<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';
    protected $guarded = ['id'];
    protected $casts = ['items' => 'array', 'total_amount' => 'decimal:2'];

    public function details() { return $this->hasMany(OrderDetail::class); }
}
