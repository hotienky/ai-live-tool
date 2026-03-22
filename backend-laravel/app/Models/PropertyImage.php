<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PropertyImage extends Model
{
    protected $fillable = ['listing_id', 'url', 'caption', 'sort_order', 'is_primary'];
    protected $casts = ['is_primary' => 'boolean'];
}
