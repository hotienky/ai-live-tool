<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lucky_wheels', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->boolean('is_active')->default(true);
            $table->jsonb('settings')->nullable(); // max_spins_per_user, etc.
            $table->integer('spin_count')->default(0);
            $table->timestamps();
        });

        Schema::create('wheel_prizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wheel_id')->constrained('lucky_wheels')->cascadeOnDelete();
            $table->string('label');
            $table->decimal('probability', 5, 2)->default(0); // 0-100%
            $table->string('prize_type')->default('text'); // product, coupon, text, nothing
            $table->string('prize_value')->nullable();
            $table->string('color')->nullable(); // wheel segment color
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('wheel_spins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wheel_id')->constrained('lucky_wheels')->cascadeOnDelete();
            $table->foreignId('prize_id')->nullable()->constrained('wheel_prizes')->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->timestamp('won_at')->useCurrent();
            $table->timestamps();

            $table->index('wheel_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wheel_spins');
        Schema::dropIfExists('wheel_prizes');
        Schema::dropIfExists('lucky_wheels');
    }
};
