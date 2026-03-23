<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add flow_config to lucky_wheels
        if (Schema::hasTable('lucky_wheels') && !Schema::hasColumn('lucky_wheels', 'flow_config')) {
            Schema::table('lucky_wheels', function (Blueprint $table) {
                $table->jsonb('flow_config')->nullable()->after('settings');
            });
        }

        // Add user tracking + form data + claim status to wheel_spins
        if (Schema::hasTable('wheel_spins')) {
            Schema::table('wheel_spins', function (Blueprint $table) {
                if (!Schema::hasColumn('wheel_spins', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('prize_id');
                }
                if (!Schema::hasColumn('wheel_spins', 'form_data')) {
                    $table->jsonb('form_data')->nullable()->after('customer_email');
                }
                if (!Schema::hasColumn('wheel_spins', 'claim_status')) {
                    $table->string('claim_status', 20)->default('pending')->after('is_redeemed');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('lucky_wheels') && Schema::hasColumn('lucky_wheels', 'flow_config')) {
            Schema::table('lucky_wheels', function (Blueprint $table) {
                $table->dropColumn('flow_config');
            });
        }
        if (Schema::hasTable('wheel_spins')) {
            Schema::table('wheel_spins', function (Blueprint $table) {
                $cols = [];
                if (Schema::hasColumn('wheel_spins', 'user_id')) $cols[] = 'user_id';
                if (Schema::hasColumn('wheel_spins', 'form_data')) $cols[] = 'form_data';
                if (Schema::hasColumn('wheel_spins', 'claim_status')) $cols[] = 'claim_status';
                if (!empty($cols)) $table->dropColumn($cols);
            });
        }
    }
};
