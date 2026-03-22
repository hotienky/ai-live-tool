<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Restaurant tables (physical tables)
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->string('number');
            $table->integer('capacity')->default(4);
            $table->string('location')->nullable(); // indoor, outdoor, vip_room
            $table->boolean('is_available')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Enhance menu_items
        if (!Schema::hasColumn('menu_items', 'variants')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->jsonb('variants')->nullable()->after('allergens'); // [{"name":"Size M","price":0},{"name":"Size L","price":10000}]
                $table->integer('preparation_time')->nullable()->after('variants'); // minutes
                $table->decimal('original_price', 12, 2)->nullable()->after('price'); // sale price support
                $table->string('spice_level')->nullable()->after('is_popular'); // mild, medium, hot
            });
        }

        // Enhance reservations
        if (!Schema::hasColumn('reservations', 'table_id')) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->unsignedBigInteger('table_id')->nullable()->after('table_number');
                $table->string('confirmation_code')->nullable()->unique()->after('status');
                $table->string('source')->default('admin')->after('table_number'); // admin, website, phone
            });
        }

        // Restaurant settings (opening hours via system_config is better, but add a dedicated table for complex schedules)
        Schema::create('restaurant_hours', function (Blueprint $table) {
            $table->id();
            $table->string('day_of_week'); // monday, tuesday, ...
            $table->time('open_time');
            $table->time('close_time');
            $table->time('last_reservation_time')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_hours');
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['table_id', 'confirmation_code', 'source']);
        });
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['variants', 'preparation_time', 'original_price', 'spice_level']);
        });
        Schema::dropIfExists('restaurant_tables');
    }
};
