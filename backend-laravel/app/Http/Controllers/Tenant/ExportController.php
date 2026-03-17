<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Traits\ApiResponse;
use App\Repositories\Lead\LeadRepositoryInterface;
use App\Repositories\Customer\CustomerRepositoryInterface;
use App\Repositories\Order\OrderRepositoryInterface;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    use ApiResponse;

    public function __construct(
        private LeadRepositoryInterface $leadRepo,
        private CustomerRepositoryInterface $customerRepo,
        private OrderRepositoryInterface $orderRepo,
    ) {}

    public function leads()
    {
        return $this->successResponse($this->leadRepo->all());
    }

    public function comments()
    {
        // chat_logs is a read-only export — no dedicated model needed
        return $this->successResponse(DB::table('chat_logs')->orderByDesc('created_at')->limit(500)->get());
    }

    public function customers()
    {
        return $this->successResponse($this->customerRepo->all());
    }

    public function report()
    {
        try {
            $leads = $this->leadRepo->all();
            $customers = $this->customerRepo->all();
            $orders = $this->orderRepo->query()->get();

            return $this->successResponse([
                'generated_at' => now()->toISOString(),
                'summary' => [
                    'total_leads' => $leads->count(),
                    'total_customers' => $customers->count(),
                    'total_orders' => $orders->count(),
                    'total_revenue' => $orders->sum('total_amount'),
                    'avg_order_value' => $orders->count() > 0 ? round($orders->avg('total_amount'), 0) : 0,
                ],
                'orders_by_status' => $orders->groupBy('status')->map->count(),
                'orders_by_payment' => $orders->groupBy('payment_status')->map->count(),
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
