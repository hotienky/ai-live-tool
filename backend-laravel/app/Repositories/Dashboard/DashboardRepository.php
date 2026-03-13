<?php
namespace App\Repositories\Dashboard;

use Illuminate\Support\Facades\DB;

class DashboardRepository implements DashboardRepositoryInterface
{
    public function getOverview(): array
    {
        return [
            'total_orders' => DB::table('orders')->count(),
            'total_products' => DB::table('products')->count(),
            'total_customers' => DB::table('customers')->count(),
            'total_revenue' => DB::table('orders')
                ->whereIn('status', ['confirmed', 'shipped', 'delivered'])
                ->sum('total_amount'),
        ];
    }

    public function getRecentLeads(int $limit = 10)
    {
        return DB::table('leads')->orderByDesc('created_at')->limit($limit)->get();
    }

    public function getAnalytics(int $days = 30)
    {
        return DB::table('orders')
            ->selectRaw("date_trunc('day', created_at) as date, count(*) as orders, coalesce(sum(total_amount), 0) as revenue")
            ->where('created_at', '>=', now()->subDays($days))
            ->groupByRaw("date_trunc('day', created_at)")
            ->orderBy('date')
            ->get();
    }

    public function getTopCustomers(int $limit = 10)
    {
        return DB::table('orders')
            ->selectRaw('customer_name, customer_phone, count(*) as order_count, coalesce(sum(total_amount), 0) as total_spent')
            ->groupBy('customer_name', 'customer_phone')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get();
    }

    public function getOrderStats()
    {
        return DB::table('orders')
            ->selectRaw("status, count(*) as count, coalesce(sum(total_amount), 0) as total")
            ->groupBy('status')
            ->get();
    }
}
