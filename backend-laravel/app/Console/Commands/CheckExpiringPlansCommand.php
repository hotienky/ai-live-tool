<?php

namespace App\Console\Commands;

use App\Events\Subscription\PlanExpiring;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Chạy hàng ngày lúc 09:00 — kiểm tra tenant nào có plan sắp hết hạn.
 * Gửi thông báo ở các mốc: 7 ngày, 3 ngày, 1 ngày.
 *
 * Yêu cầu: tenants table có cột plan_expires_at (TIMESTAMP).
 */
class CheckExpiringPlansCommand extends Command
{
    protected $signature   = 'notifications:check-expiring-plans';
    protected $description = 'Kiểm tra gói dịch vụ sắp hết hạn và gửi thông báo';

    public function handle(): int
    {
        $milestones = [7, 3, 1]; // số ngày trước khi hết hạn

        $fired = 0;
        foreach ($milestones as $days) {
            // Tìm tenant hết hạn đúng trong khoảng ngày hôm nay + $days
            $from = now()->addDays($days)->startOfDay();
            $to   = now()->addDays($days)->endOfDay();

            $tenants = DB::connection('landlord')
                ->table('tenants')
                ->whereBetween('plan_expires_at', [$from, $to])
                ->where('status', 'active')
                ->select('id', 'name', 'plan_expires_at')
                ->get();

            foreach ($tenants as $tenant) {
                event(new PlanExpiring(
                    tenantId:   $tenant->id,
                    tenantName: $tenant->name ?? $tenant->id,
                    daysLeft:   $days,
                    expiresAt:  $tenant->plan_expires_at,
                ));

                $fired++;
                $this->line("  → Tenant [{$tenant->name}] hết hạn sau {$days} ngày");
            }
        }

        $this->info($fired > 0 ? "Đã gửi {$fired} thông báo gói hết hạn." : 'Không có gói nào sắp hết hạn.');
        return self::SUCCESS;
    }
}
