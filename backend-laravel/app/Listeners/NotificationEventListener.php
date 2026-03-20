<?php

namespace App\Listeners;

use App\Mail\LowStockMail;
use App\Mail\NewOrderAdminMail;
use App\Mail\PlanExpiringMail;
use App\Services\Notification\NotificationMailService;
use App\Services\Notification\NotificationService;
use App\Events\Order\OrderPlaced;
use App\Events\Order\OrderCancelled;
use App\Events\Order\OrderStatusChanged;
use App\Events\Product\ReviewSubmitted;
use App\Events\Product\StockLow;
use App\Events\Tenant\SettingsChanged;
use App\Events\Subscription\PlanExpiring;
use App\Events\Subscription\ModuleSubscribed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener trung tâm xử lý tất cả notification events.
 * Implements ShouldQueue để xử lý bất đồng bộ qua queue.
 */
class NotificationEventListener implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public function __construct(
        private NotificationService $service,
        private NotificationMailService $mailer,
    ) {}

    // ─── Order Events ────────────────────────────────────────────────

    public function handleOrderPlaced(OrderPlaced $event): void
    {
        $order = $event->order;
        $roles = ['super_admin', 'manager'];

        $this->service->notify(
            type:    'order.placed',
            title:   'Đơn hàng mới',
            message: "Đơn hàng #{$order->order_number} từ {$order->customer_name} — " . number_format($order->total_amount) . 'đ',
            data:    [
                'order_id'     => $order->id,
                'order_number' => $order->order_number,
                'total_amount' => $order->total_amount,
                'customer'     => $order->customer_name,
            ],
            link:    "/orders/{$order->id}",
        );

        // Email thông báo đơn hàng mới cho admin
        $this->mailer->sendToRoles(NewOrderAdminMail::class, [$order], $roles);
    }

    public function handleOrderCancelled(OrderCancelled $event): void
    {
        $order = $event->order;
        $by    = $event->cancelledBy === 'customer' ? 'khách hàng' : 'admin';
        $this->service->notify(
            type:    'order.cancelled',
            title:   'Đơn hàng bị hủy',
            message: "Đơn #{$order->order_number} bị hủy bởi {$by}",
            data:    [
                'order_id'     => $order->id,
                'order_number' => $order->order_number,
                'cancelled_by' => $event->cancelledBy,
            ],
            link:    "/orders/{$order->id}",
        );
    }

    public function handleOrderStatusChanged(OrderStatusChanged $event): void
    {
        $order = $event->order;
        $statusLabels = [
            'pending'    => 'Chờ xác nhận',
            'confirmed'  => 'Đã xác nhận',
            'processing' => 'Đang xử lý',
            'shipping'   => 'Đang giao',
            'delivered'  => 'Đã giao',
            'returned'   => 'Hoàn trả',
        ];
        $newLabel = $statusLabels[$event->newStatus] ?? $event->newStatus;
        $this->service->notify(
            type:    'order.status_changed',
            title:   'Cập nhật trạng thái đơn hàng',
            message: "Đơn #{$order->order_number} chuyển sang: {$newLabel}",
            data:    [
                'order_id'   => $order->id,
                'old_status' => $event->oldStatus,
                'new_status' => $event->newStatus,
            ],
            link:    "/orders/{$order->id}",
        );
    }

    // ─── Product Events ──────────────────────────────────────────────

    public function handleReviewSubmitted(ReviewSubmitted $event): void
    {
        $review = $event->review;
        $stars  = str_repeat('★', $review->rating) . str_repeat('☆', 5 - $review->rating);
        $action = $event->isUpdate ? 'cập nhật' : 'mới';
        $this->service->notify(
            type:    'review.submitted',
            title:   "Review sản phẩm {$action}",
            message: "{$review->customer_name} đánh giá {$stars} cho \"{$event->productName}\"",
            data:    [
                'review_id'    => $review->id,
                'product_id'   => $event->productId,
                'product_name' => $event->productName,
                'rating'       => $review->rating,
                'customer'     => $review->customer_name,
            ],
            link:    "/products/{$event->productId}#reviews",
        );
    }

    public function handleStockLow(StockLow $event): void
    {
        $product = $event->product;
        $roles   = ['super_admin', 'manager'];

        if ($event->outOfStock) {
            $this->service->notify(
                type:    'product.out_of_stock',
                title:   'Sản phẩm hết hàng',
                message: "\"{$product->name}\" đã hết hàng (tồn kho: 0)",
                data:    ['product_id' => $product->id, 'stock' => 0],
                link:    "/products/{$product->id}",
            );
        } else {
            $this->service->notify(
                type:    'product.stock_low',
                title:   'Tồn kho thấp',
                message: "\"{$product->name}\" còn {$event->currentStock} sản phẩm (ngưỡng: {$event->threshold})",
                data:    [
                    'product_id'    => $product->id,
                    'current_stock' => $event->currentStock,
                    'threshold'     => $event->threshold,
                ],
                link:    "/products/{$product->id}",
            );
        }

        // Email cảnh báo tồn kho
        $this->mailer->sendToRoles(
            LowStockMail::class,
            [$product, $event->currentStock, $event->threshold, $event->outOfStock],
            $roles,
        );
    }

    // ─── Tenant Events ───────────────────────────────────────────────

    public function handleSettingsChanged(SettingsChanged $event): void
    {
        $keys = implode(', ', $event->changedKeys);
        $this->service->notify(
            type:    'settings.changed',
            title:   'Cấu hình cửa hàng thay đổi',
            message: "Nhóm [{$event->group}] đã được cập nhật: {$keys}",
            data:    [
                'group'       => $event->group,
                'changed_keys'=> $event->changedKeys,
                'by_user_id'  => $event->changedByUserId,
            ],
            link:    '/settings',
        );
    }

    // ─── Subscription Events ─────────────────────────────────────────

    public function handlePlanExpiring(PlanExpiring $event): void
    {
        $this->service->notify(
            type:    'subscription.expiring',
            title:   'Gói sắp hết hạn',
            message: "Gói dịch vụ sắp hết hạn sau {$event->daysLeft} ngày ({$event->expiresAt})",
            data:    [
                'tenant_id'   => $event->tenantId,
                'tenant_name' => $event->tenantName,
                'days_left'   => $event->daysLeft,
                'expires_at'  => $event->expiresAt,
            ],
            link:    '/subscription',
        );

        // Email nhắc nhở gia hạn — chỉ super_admin
        $this->mailer->sendToRoles(
            PlanExpiringMail::class,
            [$event->tenantName, $event->daysLeft, $event->expiresAt],
            ['super_admin'],
        );
    }

    public function handleModuleSubscribed(ModuleSubscribed $event): void
    {
        $action = $event->isActivation ? 'kích hoạt' : 'hủy';
        $this->service->notify(
            type:    $event->isActivation ? 'module.subscribed' : 'module.unsubscribed',
            title:   "Module đã được {$action}",
            message: "Module \"{$event->moduleName}\" đã được {$action}",
            data:    [
                'module_id'   => $event->moduleId,
                'module_name' => $event->moduleName,
                'activated'   => $event->isActivation,
            ],
            link:    '/settings/modules',
        );
    }

    // ─── Failed job ──────────────────────────────────────────────────

    public function failed(mixed $event, \Throwable $exception): void
    {
        Log::error('[NotificationEventListener] failed', [
            'event'     => get_class($event),
            'exception' => $exception->getMessage(),
        ]);
    }
}
