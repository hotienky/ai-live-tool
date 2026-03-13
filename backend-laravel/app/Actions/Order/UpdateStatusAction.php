<?php
namespace App\Actions\Order;

use Illuminate\Http\Request;

class UpdateStatusAction extends BaseAction
{
    public function __invoke(Request $request, $id)
    {
        try {
            $data = $request->validate(['status' => 'required|string']);
            $user = $request->attributes->get('auth_user');
            $order = $this->orderRepository->updateStatus($id, $data['status'], $user->id ?? null);
            return $this->successResponse($order, 'Order status updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
