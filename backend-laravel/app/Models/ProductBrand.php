<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ProductBrand extends Model
{
    protected $table = 'product_brands';
    protected $guarded = ['id'];
    protected $casts = ['is_active' => 'boolean'];
}
