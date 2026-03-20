<?php

namespace App\Console\Commands;

use App\Services\Notification\NotificationService;
use Illuminate\Console\Command;

/**
 * Chạy hàng ngày lúc 02:00 — dọn dẹp thông báo cũ theo config retention.
 * Chỉ thực hiện khi notification.retention_enabled = true.
 */
class CleanupNotificationsCommand extends Command
{
    protected $signature   = 'notifications:cleanup';
    protected $description = 'Xóa thông báo cũ theo cấu hình retention';

    public function __construct(private NotificationService $notifService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $deleted = $this->notifService->cleanupExpired();

        if ($deleted > 0) {
            $this->info("Đã xóa {$deleted} thông báo cũ.");
        } else {
            $this->info('Không có thông báo nào cần xóa (retention disabled hoặc chưa đến hạn).');
        }

        return self::SUCCESS;
    }
}
