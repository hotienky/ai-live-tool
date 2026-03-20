<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ─── Notification Cron Jobs ───────────────────────────────────────

// Kiểm tra tồn kho thấp — mỗi 15 phút
Schedule::command('notifications:check-low-stock')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Kiểm tra đơn hàng pending quá lâu — mỗi giờ
Schedule::command('notifications:check-pending-orders')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// Kiểm tra gói sắp hết hạn — hàng ngày lúc 09:00
Schedule::command('notifications:check-expiring-plans')
    ->dailyAt('09:00')
    ->withoutOverlapping();

// Dọn dẹp thông báo cũ — hàng ngày lúc 02:00
Schedule::command('notifications:cleanup')
    ->dailyAt('02:00')
    ->withoutOverlapping();
