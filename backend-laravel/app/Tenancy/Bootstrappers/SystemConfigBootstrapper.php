<?php

namespace App\Tenancy\Bootstrappers;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Contracts\TenancyBootstrapper;
use Stancl\Tenancy\Contracts\Tenant;

/**
 * Load system_configs từ DB của tenant và apply vào Laravel config tại runtime.
 * Chạy sau DatabaseTenancyBootstrapper (DB đã switch sang tenant).
 */
class SystemConfigBootstrapper implements TenancyBootstrapper
{
    /** Config keys gốc trước khi override — dùng để revert */
    protected array $original = [];

    public function bootstrap(Tenant $_tenant): void
    {
        try {
            // groupBy group_name trước để tránh xung đột key trùng tên
            // (vd: redis_host tồn tại ở cả group 'cache' lẫn 'queue')
            $byGroup = DB::table('system_configs')
                ->whereIn('group_name', ['mail', 'cache', 'queue'])
                ->get(['key', 'value', 'group_name'])
                ->groupBy('group_name')
                ->map(fn($rows) => $rows->pluck('value', 'key'));

            // Tạo getter riêng cho từng group
            $getFor = fn(string $group) =>
                fn(string $key, mixed $default = null) =>
                    $byGroup->get($group)?->get($key) ?? $default;

            $this->applyMail($getFor('mail'));
            $this->applyCache($getFor('cache'));
            $this->applyQueue($getFor('queue'));
        } catch (\Throwable) {
            // Bảng chưa migrate hoặc tenant mới — bỏ qua, dùng .env
        }
    }

    public function revert(): void
    {
        foreach ($this->original as $key => $value) {
            Config::set($key, $value);
        }
        $this->original = [];

        $this->forgetResolvedInstances();
    }

    // ─── Mail ─────────────────────────────────────────────────────────────────

    private function applyMail(callable $get): void
    {
        $driver = $get('mail_driver');
        if (!$driver) return;

        $this->set('mail.default', $driver);

        // From address/name áp dụng cho mọi driver
        if ($from = $get('mail_from_address')) $this->set('mail.from.address', $from);
        if ($name = $get('mail_from_name'))    $this->set('mail.from.name',    $name);

        match ($driver) {
            'smtp'     => $this->applySmtp($get),
            'ses'      => $this->applySes($get),
            'mailgun'  => $this->applyMailgun($get),
            'sendgrid' => $this->applySendgrid($get),
            default    => null,
        };

        $this->forgetResolvedInstances();
    }

    private function applySmtp(callable $get): void
    {
        $map = [
            'mail_host'       => 'mail.mailers.smtp.host',
            'mail_port'       => 'mail.mailers.smtp.port',
            'mail_encryption' => 'mail.mailers.smtp.encryption',
            'mail_username'   => 'mail.mailers.smtp.username',
            'mail_password'   => 'mail.mailers.smtp.password',
        ];

        foreach ($map as $dbKey => $configKey) {
            if (($v = $get($dbKey)) !== null) $this->set($configKey, $v);
        }
    }

    private function applySes(callable $get): void
    {
        $map = [
            'mail_ses_key'    => 'services.ses.key',
            'mail_ses_secret' => 'services.ses.secret',
            'mail_ses_region' => 'services.ses.region',
        ];

        foreach ($map as $dbKey => $configKey) {
            if (($v = $get($dbKey)) !== null) $this->set($configKey, $v);
        }

        $this->set('mail.mailers.ses', ['transport' => 'ses']);
    }

    private function applyMailgun(callable $get): void
    {
        $map = [
            'mail_mailgun_domain'   => 'services.mailgun.domain',
            'mail_mailgun_secret'   => 'services.mailgun.secret',
            'mail_mailgun_endpoint' => 'services.mailgun.endpoint',
        ];

        foreach ($map as $dbKey => $configKey) {
            if (($v = $get($dbKey)) !== null) $this->set($configKey, $v);
        }

        $this->set('mail.mailers.mailgun', ['transport' => 'mailgun']);
    }

    private function applySendgrid(callable $get): void
    {
        if ($key = $get('mail_sendgrid_api_key')) {
            $this->set('services.sendgrid.api_key', $key);
            $this->set('mail.mailers.sendgrid', [
                'transport'  => 'smtp',
                'host'       => 'smtp.sendgrid.net',
                'port'       => 587,
                'encryption' => 'tls',
                'username'   => 'apikey',
                'password'   => $key,
            ]);
        }
    }

    // ─── Cache ────────────────────────────────────────────────────────────────

    private function applyCache(callable $get): void
    {
        $driver = $get('cache_driver');
        if (!$driver) return;

        $this->set('cache.default', $driver);

        if ($ttl = $get('cache_ttl')) {
            // Áp dụng TTL vào đúng store đang dùng
            $this->set("cache.stores.{$driver}.ttl", (int) $ttl);
        }

        if ($driver === 'redis') {
            $this->applyRedis($get, 'cache');
        }
    }

    // ─── Queue ────────────────────────────────────────────────────────────────

    private function applyQueue(callable $get): void
    {
        $driver = $get('queue_driver');
        if (!$driver) return;

        $this->set('queue.default', $driver);

        if ($retry = $get('queue_retry_after')) {
            $this->set('queue.connections.database.retry_after', (int) $retry);
            $this->set('queue.connections.redis.retry_after',    (int) $retry);
        }

        if ($driver === 'redis') {
            $this->applyRedis($get, 'queue');
        }

        if ($driver === 'sqs') {
            $map = [
                'sqs_key'       => 'queue.connections.sqs.key',
                'sqs_secret'    => 'queue.connections.sqs.secret',
                'sqs_region'    => 'queue.connections.sqs.region',
                'sqs_queue_url' => 'queue.connections.sqs.queue',
            ];
            foreach ($map as $dbKey => $configKey) {
                if (($v = $get($dbKey)) !== null) $this->set($configKey, $v);
            }
        }
    }

    // ─── Redis (dùng chung cho cả cache & queue) ──────────────────────────────

    private function applyRedis(callable $get, string $context): void
    {
        $host     = $get('redis_host');
        $port     = $get('redis_port');
        $password = $get('redis_password');
        $db       = $get('redis_db', 0);

        $connection = $context === 'cache' ? 'cache' : 'default';

        if ($host) $this->set("database.redis.{$connection}.host",     $host);
        if ($port) $this->set("database.redis.{$connection}.port",     (int) $port);
        if ($password !== null && $password !== '') {
            $this->set("database.redis.{$connection}.password", $password);
        }
        $this->set("database.redis.{$connection}.database", (int) $db);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Lưu giá trị gốc rồi set config mới */
    private function set(string $key, mixed $value): void
    {
        if (!\array_key_exists($key, $this->original)) {
            $this->original[$key] = Config::get($key);
        }
        Config::set($key, $value);
    }

    /**
     * Xoá các service đã resolve khỏi container.
     * Cần thiết cho Octane/Swoole — PHP-FPM không cần nhưng cũng không hại gì.
     */
    private function forgetResolvedInstances(): void
    {
        $instances = [
            'mailer', 'mail.manager', 'swift.mailer', // Mail
            'cache', 'cache.store',                   // Cache
            'queue', 'queue.connection',              // Queue
        ];

        foreach ($instances as $abstract) {
            try {
                app()->forgetInstance($abstract);
            } catch (\Throwable) {
                // instance chưa tồn tại — bỏ qua
            }
        }
    }
}
