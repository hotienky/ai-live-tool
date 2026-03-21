<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Thêm plan_expires_at vào bảng tenants (master DB).
 * Cần thiết cho CheckExpiringPlansCommand cron job.
 */
return new class extends Migration
{
    // Chỉ định chạy trên master database (landlord connection)
    protected $connection = 'master';

    public function up(): void
    {
        Schema::connection('master')->table('tenants', function (Blueprint $table) {
            if (!Schema::connection('master')->hasColumn('tenants', 'plan_expires_at')) {
                $table->timestamp('plan_expires_at')->nullable()->after('plan');
            }
            if (!Schema::connection('master')->hasColumn('tenants', 'plan_renewed_at')) {
                $table->timestamp('plan_renewed_at')->nullable()->after('plan_expires_at');
            }
        });
    }

    public function down(): void
    {
        Schema::connection('master')->table('tenants', function (Blueprint $table) {
            $table->dropColumn(['plan_expires_at', 'plan_renewed_at']);
        });
    }
};
