<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    protected $table = 'product_categories';
    protected $guarded = ['id'];
    protected $casts = ['is_active' => 'boolean'];
}
