<?php
namespace App\Repositories\Order;
use App\Repositories\BaseRepoInterface;

interface OrderRepositoryInterface extends BaseRepoInterface
{
    public function getOrders();
    public function getStats();
    public function updateStatus(int $id, string $status, ?int $adminId = null);
    public function getDetails(int $orderId);
    public function getTotals(int $orderId);
    public function getHistory(int $orderId);
    public function getOrderStatuses();
    public function getPaymentStatuses();
    public function createOrderDetails(int $orderId, array $items): void;
    public function getVariants(int $productId);
}
