<?php
namespace App\Actions\Order;

use App\Services\AccountingService;
use Illuminate\Http\Request;

class UpdateStatusAction extends BaseAction
{
    protected AccountingService $accountingService;

    public function __construct(
        \App\Repositories\Order\OrderRepositoryInterface $orderRepository,
        AccountingService $accountingService,
    ) {
        parent::__construct($orderRepository);
        $this->accountingService = $accountingService;
    }

    public function __invoke(Request $request, $id)
    {
        try {
            $data = $request->validate(['status' => 'required|string']);
            $user = $request->attributes->get('auth_user');
            $order = $this->orderRepository->updateStatus($id, $data['status'], $user->id ?? null);

            // Auto-generate accounting entries on status change
            $status = $data['status'];
            if (in_array($status, ['delivered', 'completed'])) {
                $this->accountingService->onOrderDelivered($order);
            } elseif (in_array($status, ['returned', 'refunded'])) {
                $this->accountingService->onOrderReturned($order);
            }

            return $this->successResponse($order, 'Order status updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
