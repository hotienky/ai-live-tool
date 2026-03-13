<?php
namespace App\Actions\Order;

use App\Repositories\Order\OrderRepositoryInterface;
use App\Traits\ApiResponse;

class BaseAction
{
    use ApiResponse;
    protected OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }
}
