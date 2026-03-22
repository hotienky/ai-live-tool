<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enhance lucky_wheels
        if (!Schema::hasColumn('lucky_wheels', 'start_date')) {
            Schema::table('lucky_wheels', function (Blueprint $table) {
                $table->timestamp('start_date')->nullable()->after('is_active');
                $table->timestamp('end_date')->nullable()->after('start_date');
                $table->integer('max_spins_per_user')->nullable()->after('end_date');
                $table->boolean('require_login')->default(false)->after('max_spins_per_user');
                $table->string('description')->nullable()->after('title');
                $table->string('background_image')->nullable()->after('require_login');
            });
        }

        // Enhance wheel_prizes
        if (!Schema::hasColumn('wheel_prizes', 'stock')) {
            Schema::table('wheel_prizes', function (Blueprint $table) {
                $table->integer('stock')->nullable()->after('color'); // null = unlimited
                $table->integer('redeemed_count')->default(0)->after('stock');
            });
        }

        // Enhance wheel_spins
        if (!Schema::hasColumn('wheel_spins', 'ip_address')) {
            Schema::table('wheel_spins', function (Blueprint $table) {
                $table->string('ip_address', 45)->nullable()->after('customer_phone');
                $table->string('customer_email')->nullable()->after('customer_phone');
                $table->boolean('is_redeemed')->default(false)->after('ip_address');
                $table->timestamp('redeemed_at')->nullable()->after('is_redeemed');
            });
        }
    }

    public function down(): void
    {
        Schema::table('lucky_wheels', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date', 'max_spins_per_user', 'require_login', 'description', 'background_image']);
        });
        Schema::table('wheel_prizes', function (Blueprint $table) {
            $table->dropColumn(['stock', 'redeemed_count']);
        });
        Schema::table('wheel_spins', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'customer_email', 'is_redeemed', 'redeemed_at']);
        });
    }
};
