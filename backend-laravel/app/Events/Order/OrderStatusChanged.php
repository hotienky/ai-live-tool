<?php

namespace App\Events\Order;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly object $order,
        public readonly string $oldStatus,
        public readonly string $newStatus,
    ) {}
}
