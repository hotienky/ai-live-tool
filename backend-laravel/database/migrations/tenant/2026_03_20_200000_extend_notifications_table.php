<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Payload chi tiết (link đến order, product, v.v.)
            $table->json('data')->nullable()->after('message');
            // Thay thế is_read bằng read_at để lưu thời điểm đọc
            $table->timestamp('read_at')->nullable()->after('data');
            // Roles nhận thông báo này (ví dụ: ["super_admin","manager"])
            $table->json('roles')->nullable()->after('read_at');
            // Kênh gửi: in_app | email | both
            $table->string('channel', 50)->default('in_app')->after('roles');
            // Hết hạn (cho retention config)
            $table->timestamp('expires_at')->nullable()->after('channel');
            // Soft delete
            $table->softDeletes();
        });

        // Seed notification config vào system_configs
        $configs = [
            ['key' => 'notification.retention_enabled', 'value' => 'false', 'type' => 'boolean', 'group_name' => 'notification'],
            ['key' => 'notification.retention_days',    'value' => '90',    'type' => 'integer', 'group_name' => 'notification'],
            ['key' => 'notification.email_enabled',     'value' => 'true',  'type' => 'boolean', 'group_name' => 'notification'],
            ['key' => 'notification.realtime_enabled',  'value' => 'true',  'type' => 'boolean', 'group_name' => 'notification'],
            ['key' => 'notification.low_stock_threshold','value' => '5',    'type' => 'integer', 'group_name' => 'notification'],
            ['key' => 'notification.pending_order_hours','value' => '24',   'type' => 'integer', 'group_name' => 'notification'],
        ];

        foreach ($configs as $config) {
            DB::table('system_configs')->insertOrIgnore($config);
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['data', 'read_at', 'roles', 'channel', 'expires_at', 'deleted_at']);
        });

        DB::table('system_configs')
            ->where('group_name', 'notification')
            ->delete();
    }
};
