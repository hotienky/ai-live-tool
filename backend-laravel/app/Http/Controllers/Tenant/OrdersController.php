<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Actions\Order\IndexAction;
use App\Actions\Order\StatsAction;
use App\Actions\Order\ShowAction;
use App\Actions\Order\UpdateStatusAction;
use App\Repositories\Order\OrderRepositoryInterface;
use App\Transformers\OrderTransformer;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class OrdersController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(
        private OrderRepositoryInterface $repo,
        private OrderTransformer $transformer,
    ) {}

    public function index(IndexAction $action) { return $action(); }
    public function stats(StatsAction $action) { return $action(); }
    public function show($id, ShowAction $action) { return $action($id); }
    public function updateStatus(Request $request, $id, UpdateStatusAction $action) { return $action($request, $id); }

    public function store(Request $request)
    {
        try {
            $order = $this->repo->store(array_merge($request->all(), [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
            $this->logActivity('order.created', 'order', $order->id, ['order_number' => $order->order_number ?? null]);
            return $this->successResponse($this->transformer->transform($order), 'Order created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $this->repo->update(array_merge($request->all(), ['updated_at' => now()]), $id);
        $this->logActivity('order.updated', 'order', $id);
        return $this->successResponse($this->transformer->transform($this->repo->find($id)), 'Order updated');
    }

    public function destroy($id)
    {
        $this->logActivity('order.deleted', 'order', $id);
        $this->repo->delete($id);
        return $this->successResponse(null, 'Order deleted');
    }

    public function getDetails($id)
    {
        return $this->successResponse($this->repo->getDetails($id));
    }

    public function getTotals($id)
    {
        return $this->successResponse($this->repo->getTotals($id));
    }

    public function getHistory($id)
    {
        return $this->successResponse($this->repo->getHistory($id));
    }

    public function getOrderStatuses()
    {
        return $this->successResponse($this->repo->getOrderStatuses());
    }

    public function getPaymentStatuses()
    {
        return $this->successResponse($this->repo->getPaymentStatuses());
    }
}
