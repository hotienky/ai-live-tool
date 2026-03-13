<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $guarded = ['id'];
    protected $table = 'cart_items';
    public $timestamps = false;
}
