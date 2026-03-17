<?php
namespace App\Actions\Storefront;

class OrderDetailAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $order = $this->orderRepo->find($id);
        if (!$order) return $this->notFoundResponse('Order not found');

        $response = $order->toArray();
        $response['details'] = $this->orderRepo->getDetails($id);

        if ($order->payment_method === 'bank') {
            $response['bank_info'] = $this->getBankInfo($order->id);
        }

        return $this->successResponse($response);
    }
}
