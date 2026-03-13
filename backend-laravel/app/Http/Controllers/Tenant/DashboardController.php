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
        return $this->successResponse($this->repo->getOverview());
    }

    public function recentLeads()
    {
        return $this->successResponse($this->repo->getRecentLeads());
    }

    public function analytics()
    {
        $days = request()->input('days', 30);
        return $this->successResponse($this->repo->getAnalytics($days));
    }

    public function topCustomers()
    {
        return $this->successResponse($this->repo->getTopCustomers());
    }

    public function orderStats()
    {
        return $this->successResponse($this->repo->getOrderStats());
    }
}
