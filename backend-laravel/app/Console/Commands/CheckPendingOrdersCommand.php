<?php

namespace App\Console\Commands;

use App\Services\Notification\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Chạy mỗi giờ — tìm đơn hàng đang ở trạng thái "pending" quá lâu.
 * Ngưỡng lấy từ system_configs: notification.pending_order_hours
 */
class CheckPendingOrdersCommand extends Command
{
    protected $signature   = 'notifications:check-pending-orders';
    protected $description = 'Cảnh báo các đơn hàng pending quá lâu chưa xử lý';

    public function __construct(private NotificationService $notifService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        try {
            $hours  = (int) (DB::table('system_configs')
                ->where('key', 'notification.pending_order_hours')
                ->value('value') ?? 24);

            $cutoff = now()->subHours($hours);

            $orders = DB::table('orders')
                ->where('status', 'pending')
                ->where('created_at', '<=', $cutoff)
                ->select('id', 'order_number', 'customer_name', 'total_amount', 'created_at')
                ->get();

            if ($orders->isEmpty()) {
                $this->info('Không có đơn hàng nào bị tồn đọng.');
                return self::SUCCESS;
            }

            foreach ($orders as $order) {
                $hoursAgo = now()->diffInHours($order->created_at);
                $this->notifService->notify(
                    type:    'order.pending_too_long',
                    title:   'Đơn hàng chờ quá lâu',
                    message: "Đơn #{$order->order_number} của {$order->customer_name} đã chờ {$hoursAgo} giờ",
                    data:    ['order_id' => $order->id, 'order_number' => $order->order_number, 'hours_ago' => $hoursAgo],
                    link:    "/orders/{$order->id}",
                );
                $this->line("  → Đơn #{$order->order_number} — chờ {$hoursAgo}h");
            }

            $this->info("Đã cảnh báo {$orders->count()} đơn hàng tồn đọng.");
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Lỗi check-pending-orders: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
