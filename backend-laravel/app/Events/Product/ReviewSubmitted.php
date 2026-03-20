<?php

namespace App\Events\Product;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReviewSubmitted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly object $review,      // stdClass từ DB::table
        public readonly int    $productId,
        public readonly string $productName,
        public readonly bool   $isUpdate = false,
    ) {}
}
