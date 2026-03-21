<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Dashboard\DashboardRepositoryInterface;
use App\Traits\ApiResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private DashboardRepositoryInterface $repo) {}

    public function overview()
    {
        try {
            return $this->successResponse($this->repo->getOverview());
        } catch (\Exception $e) {
            return $this->successResponse([
                'total_products' => 0, 'total_orders' => 0, 'total_revenue' => 0,
                'total_customers' => 0, 'total_streams' => 0, 'total_comments' => 0,
            ]);
        }
    }

    public function recentLeads()
    {
        try {
            return $this->successResponse($this->repo->getRecentLeads());
        } catch (\Exception $e) {
            return $this->successResponse([]);
        }
    }

    public function analytics()
    {
        try {
            $days = request()->input('days', 30);
            return $this->successResponse($this->repo->getAnalytics($days));
        } catch (\Exception $e) {
            return $this->successResponse(['orders' => [], 'revenue' => [], 'comments' => []]);
        }
    }

    public function topCustomers()
    {
        try {
            return $this->successResponse($this->repo->getTopCustomers());
        } catch (\Exception $e) {
            return $this->successResponse([]);
        }
    }

    public function orderStats()
    {
        try {
            return $this->successResponse($this->repo->getOrderStats());
        } catch (\Exception $e) {
            return $this->successResponse([
                'pending' => 0, 'confirmed' => 0, 'shipping' => 0,
                'completed' => 0, 'cancelled' => 0,
            ]);
        }
    }
}
