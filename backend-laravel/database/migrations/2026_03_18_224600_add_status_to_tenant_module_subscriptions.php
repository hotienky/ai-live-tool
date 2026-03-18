<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('master')->table('tenant_module_subscriptions', function (Blueprint $table) {
            $table->string('status', 20)->default('active')->after('is_active');
            // status: active (free+installed), pending (paid+requested), approved, rejected
            $table->text('request_note')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::connection('master')->table('tenant_module_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['status', 'request_note']);
        });
    }
};
