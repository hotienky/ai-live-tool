<?php

namespace App\Events\Order;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCancelled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly object $order,
        public readonly ?string $cancelledBy = 'customer', // 'customer' | 'admin'
    ) {}
}
