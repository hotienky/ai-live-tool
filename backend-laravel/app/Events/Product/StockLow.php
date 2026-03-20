<?php

namespace App\Events\Product;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockLow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly object $product,
        public readonly int    $currentStock,
        public readonly int    $threshold,
        public readonly bool   $outOfStock = false,
    ) {}
}
