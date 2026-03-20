<?php

namespace App\Services\Notification;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Gửi email thông báo cho admin users theo role.
 * Chỉ gửi khi notification.email_enabled = true trong system_configs.
 */
class NotificationMailService
{
    /**
     * Gửi email tới tất cả admin có role phù hợp.
     *
     * @param string $mailable  Fully-qualified class name của Mailable
     * @param array  $args      Constructor args của Mailable
     * @param array  $roles     Roles nhận email
     */
    public function sendToRoles(string $mailable, array $args, array $roles): void
    {
        if (!$this->isEmailEnabled()) {
            return;
        }

        // Chưa cấu hình mail driver cho tenant này → bỏ qua, không queue job vô ích
        if (!$this->isMailConfigured()) {
            return;
        }

        $emails = $this->getAdminEmailsByRoles($roles);

        foreach ($emails as $email) {
            try {
                Mail::to($email)->queue(new $mailable(...$args));
            } catch (\Throwable $e) {
                Log::warning("[NotificationMailService] Failed to queue mail to {$email}: " . $e->getMessage());
            }
        }
    }

    /**
     * Lấy danh sách email của admins theo roles.
     */
    public function getAdminEmailsByRoles(array $roles): array
    {
        return DB::table('users as u')
            ->join('user_roles as ur', 'ur.user_id', '=', 'u.id')
            ->join('roles as r', 'r.id', '=', 'ur.role_id')
            ->whereIn('r.name', $roles)
            ->where('u.is_active', true)
            ->whereNotNull('u.email')
            ->where('u.email', '!=', '')
            ->pluck('u.email')
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Lấy thông tin shop từ system_configs.
     */
    public static function getShopInfo(): array
    {
        $configs = DB::table('system_configs')
            ->whereIn('key', ['shop_name', 'shop_email', 'shop_phone', 'shop_logo'])
            ->pluck('value', 'key')
            ->toArray();

        return [
            'name'  => $configs['shop_name']  ?? config('app.name'),
            'email' => $configs['shop_email'] ?? config('mail.from.address'),
            'phone' => $configs['shop_phone'] ?? '',
            'logo'  => $configs['shop_logo']  ?? '',
        ];
    }

    private function isMailConfigured(): bool
    {
        return (bool) Cache::remember('notif.mail_configured', 300, fn () =>
            DB::table('system_configs')
                ->where('key', 'mail_driver')
                ->where('group_name', 'mail')
                ->whereNotNull('value')
                ->where('value', '!=', '')
                ->exists()
        );
    }

    private function isEmailEnabled(): bool
    {
        // Cache 5 phút để tránh query DB mỗi lần gửi mail
        $val = Cache::remember('notif.email_enabled', 300, fn () =>
            DB::table('system_configs')
                ->where('key', 'notification.email_enabled')
                ->value('value') ?? 'true'
        );

        return $val !== 'false';
    }
}
