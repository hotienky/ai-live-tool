<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enhance booking_services
        if (!Schema::hasColumn('booking_services', 'buffer_minutes')) {
            Schema::table('booking_services', function (Blueprint $table) {
                $table->integer('buffer_minutes')->default(0)->after('duration_minutes');
                $table->jsonb('working_hours')->nullable()->after('buffer_minutes'); // {"mon":"09:00-18:00",...}
                $table->string('category')->nullable()->after('image');
                $table->integer('max_bookings_per_slot')->default(1)->after('sort_order');
            });
        }

        // Enhance booking_appointments
        if (!Schema::hasColumn('booking_appointments', 'confirmed_at')) {
            Schema::table('booking_appointments', function (Blueprint $table) {
                $table->timestamp('confirmed_at')->nullable()->after('status');
                $table->timestamp('cancelled_at')->nullable()->after('confirmed_at');
                $table->string('cancellation_reason')->nullable()->after('cancelled_at');
                $table->boolean('reminder_sent')->default(false)->after('notes');
                $table->decimal('total_price', 12, 2)->default(0)->after('reminder_sent');
            });
        }
    }

    public function down(): void
    {
        Schema::table('booking_services', function (Blueprint $table) {
            $table->dropColumn(['buffer_minutes', 'working_hours', 'category', 'max_bookings_per_slot']);
        });
        Schema::table('booking_appointments', function (Blueprint $table) {
            $table->dropColumn(['confirmed_at', 'cancelled_at', 'cancellation_reason', 'reminder_sent', 'total_price']);
        });
    }
};
