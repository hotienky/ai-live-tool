<?php
namespace App\Actions\Order;

class ShowAction extends BaseAction
{
    public function __invoke($id)
    {
        $order = $this->orderRepository->find($id);
        return $order ? $this->successResponse($order) : $this->notFoundResponse('Order not found');
    }
}
