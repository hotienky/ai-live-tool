<?php
namespace App\Repositories\Order;

use App\Models\Order;
use App\Repositories\BaseEloquentRepository;
use App\Pipelines\OrderFilterPipeline;
use Illuminate\Support\Facades\DB;

class OrderRepository extends BaseEloquentRepository implements OrderRepositoryInterface
{
    public function __construct(Order $model) { parent::__construct($model); }

    public function getOrders()
    {
        $query = $this->model->query();
        $query = OrderFilterPipeline::run($query, request()->all());
        $query->orderByDesc('created_at');
        return $query->get();
    }

    public function getStats()
    {
        return [
            'total' => $this->model->count(),
            'pending' => $this->model->where('status', 'pending')->count(),
            'confirmed' => $this->model->where('status', 'confirmed')->count(),
            'shipped' => $this->model->where('status', 'shipped')->count(),
            'delivered' => $this->model->where('status', 'delivered')->count(),
            'cancelled' => $this->model->where('status', 'cancelled')->count(),
            'revenue' => $this->model->whereIn('status', ['confirmed', 'shipped', 'delivered'])->sum('total_amount'),
        ];
    }

    public function updateStatus(int $id, string $status, ?int $adminId = null)
    {
        $update = ['status' => $status, 'updated_at' => now()];
        if ($status === 'confirmed') $update['confirmed_at'] = now();
        if ($status === 'shipped') $update['shipped_at'] = now();
        if ($status === 'delivered') $update['delivered_at'] = now();

        $this->update($update, $id);

        DB::table('order_histories')->insert([
            'order_id' => $id,
            'order_status_id' => 0,
            'content' => "Cập nhật trạng thái: {$status}",
            'admin_id' => $adminId,
            'add_date' => now(),
        ]);

        return $this->find($id);
    }

    public function getDetails(int $orderId)
    {
        return DB::table('order_details')->where('order_id', $orderId)->get();
    }

    public function getTotals(int $orderId)
    {
        return DB::table('order_totals')->where('order_id', $orderId)->orderBy('sort')->get();
    }

    public function getHistory(int $orderId)
    {
        return DB::table('order_histories')->where('order_id', $orderId)->orderByDesc('add_date')->get();
    }

    public function getOrderStatuses()
    {
        return DB::table('order_statuses')->get();
    }

    public function getPaymentStatuses()
    {
        return DB::table('payment_statuses')->get();
    }

    public function createOrderDetails(int $orderId, array $items): void
    {
        foreach ($items as $item) {
            $qty = intval($item['qty'] ?? 1);
            $price = floatval($item['price'] ?? 0);
            DB::table('order_details')->insert([
                'order_id' => $orderId,
                'product_id' => $item['product_id'] ?? $item['productId'] ?? null,
                'name' => $item['name'] ?? '',
                'sku' => $item['sku'] ?? '',
                'price' => $price,
                'qty' => $qty,
                'total_price' => $price * $qty,
                'created_at' => now(),
            ]);
        }
    }

    public function getVariants(int $productId)
    {
        return DB::table('product_variants')->where('product_id', $productId)->get();
    }
}
