<?php
namespace App\Repositories\Dashboard;
use App\Repositories\BaseRepoInterface;

interface DashboardRepositoryInterface
{
    public function getOverview(): array;
    public function getRecentLeads(int $limit = 10);
    public function getAnalytics(int $days = 30);
    public function getTopCustomers(int $limit = 10);
    public function getOrderStats();
}
