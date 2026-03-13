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
}
