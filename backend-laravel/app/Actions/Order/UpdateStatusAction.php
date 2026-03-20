<?php
namespace App\Actions\Order;

use App\Events\Order\OrderCancelled;
use App\Events\Order\OrderStatusChanged;
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

            // Lưu trạng thái cũ trước khi update
            $oldOrder = $this->orderRepository->find($id);
            $oldStatus = $oldOrder?->status ?? 'unknown';

            $order = $this->orderRepository->updateStatus($id, $data['status'], $user->id ?? null);

            // Auto-generate accounting entries on status change
            $newStatus = $data['status'];
            if (in_array($newStatus, ['delivered', 'completed'])) {
                $this->accountingService->onOrderDelivered($order);
            } elseif (in_array($newStatus, ['returned', 'refunded'])) {
                $this->accountingService->onOrderReturned($order);
            }

            // Thông báo admin
            if ($newStatus === 'cancelled') {
                event(new OrderCancelled($order, 'admin'));
            } else {
                event(new OrderStatusChanged($order, $oldStatus, $newStatus));
            }

            return $this->successResponse($order, 'Order status updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
