<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function overview()
    {
        return $this->successResponse([
            'total_orders' => DB::table('orders')->count(),
            'total_products' => DB::table('products')->count(),
            'total_customers' => DB::table('customers')->count(),
            'total_revenue' => DB::table('orders')->whereIn('status', ['confirmed', 'shipped', 'delivered'])->sum('total_amount'),
        ]);
    }

    public function recentLeads()
    {
        return $this->successResponse(DB::table('leads')->orderByDesc('created_at')->limit(10)->get());
    }

    public function analytics()
    {
        $days = request()->input('days', 30);
        return $this->successResponse(
            DB::table('orders')
                ->selectRaw("date_trunc('day', created_at) as date, count(*) as orders, coalesce(sum(total_amount), 0) as revenue")
                ->where('created_at', '>=', now()->subDays($days))
                ->groupByRaw("date_trunc('day', created_at)")
                ->orderBy('date')
                ->get()
        );
    }

    public function topCustomers()
    {
        return $this->successResponse(
            DB::table('orders')
                ->selectRaw('customer_name, customer_phone, count(*) as order_count, coalesce(sum(total_amount), 0) as total_spent')
                ->groupBy('customer_name', 'customer_phone')
                ->orderByDesc('total_spent')
                ->limit(10)
                ->get()
        );
    }

    public function orderStats()
    {
        return $this->successResponse(
            DB::table('orders')
                ->selectRaw("status, count(*) as count, coalesce(sum(total_amount), 0) as total")
                ->groupBy('status')
                ->get()
        );
    }
}
