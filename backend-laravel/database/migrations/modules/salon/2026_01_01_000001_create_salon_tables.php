<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salon_services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration_minutes')->default(30);
            $table->decimal('price', 12, 2)->default(0);
            $table->string('category')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('salon_staff', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('avatar')->nullable();
            $table->jsonb('specialties')->nullable(); // ['hair', 'nails', ...]
            $table->boolean('is_active')->default(true);
            $table->jsonb('working_hours')->nullable(); // { "mon": "09:00-18:00", ... }
            $table->timestamps();
        });

        Schema::create('salon_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('salon_services')->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('salon_staff')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->date('date');
            $table->string('time_slot'); // e.g. "10:30"
            $table->string('status')->default('pending'); // pending, confirmed, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salon_appointments');
        Schema::dropIfExists('salon_staff');
        Schema::dropIfExists('salon_services');
    }
};
