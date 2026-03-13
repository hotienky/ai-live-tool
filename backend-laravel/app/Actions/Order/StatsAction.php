<?php
namespace App\Actions\Order;

class StatsAction extends BaseAction
{
    public function __invoke()
    {
        try {
            return $this->successResponse($this->orderRepository->getStats(), 'Order stats retrieved');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
