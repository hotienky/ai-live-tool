<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class FlashSaleItem extends Model
{
    protected $table = 'flash_sale_items';
    public $timestamps = false;

    protected $fillable = [
        'flash_sale_id', 'product_id',
        'original_price', 'sale_price',
        'stock_limit', 'sold_count',
    ];

    protected $casts = [
        'original_price' => 'decimal:2',
        'sale_price'     => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
