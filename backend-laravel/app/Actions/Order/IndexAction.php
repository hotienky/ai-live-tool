<?php
namespace App\Actions\Order;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        try {
            $orders = $this->orderRepository->getOrders();
            return $this->successResponse($orders, 'Orders retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
