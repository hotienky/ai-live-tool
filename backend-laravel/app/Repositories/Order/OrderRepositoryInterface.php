<?php
namespace App\Repositories\Order;
use App\Repositories\BaseRepoInterface;

interface OrderRepositoryInterface extends BaseRepoInterface
{
    public function getOrders();
    public function getStats();
    public function updateStatus(int $id, string $status, ?int $adminId = null);
}
