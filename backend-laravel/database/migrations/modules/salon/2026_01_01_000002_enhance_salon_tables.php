<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Staff-Service mapping (pivot)
        Schema::create('salon_service_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('salon_services')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('salon_staff')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['service_id', 'staff_id']);
        });

        // Staff days off
        Schema::create('salon_staff_days_off', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('salon_staff')->cascadeOnDelete();
            $table->date('date');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->index(['staff_id', 'date']);
        });

        // Enhance salon_appointments
        if (!Schema::hasColumn('salon_appointments', 'confirmed_at')) {
            Schema::table('salon_appointments', function (Blueprint $table) {
                $table->timestamp('confirmed_at')->nullable()->after('status');
                $table->timestamp('completed_at')->nullable()->after('confirmed_at');
                $table->decimal('total_price', 12, 2)->default(0)->after('notes');
                $table->boolean('reminder_sent')->default(false)->after('total_price');
                $table->string('customer_email')->nullable()->after('customer_phone');
            });
        }

        // Enhance salon_services with categories
        if (!Schema::hasColumn('salon_services', 'is_popular')) {
            Schema::table('salon_services', function (Blueprint $table) {
                $table->boolean('is_popular')->default(false)->after('is_active');
            });
        }
    }

    public function down(): void
    {
        Schema::table('salon_services', function (Blueprint $table) {
            $table->dropColumn(['is_popular']);
        });
        Schema::table('salon_appointments', function (Blueprint $table) {
            $table->dropColumn(['confirmed_at', 'completed_at', 'total_price', 'reminder_sent', 'customer_email']);
        });
        Schema::dropIfExists('salon_staff_days_off');
        Schema::dropIfExists('salon_service_staff');
    }
};
