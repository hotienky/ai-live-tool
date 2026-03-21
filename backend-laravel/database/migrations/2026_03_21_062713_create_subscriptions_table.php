<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('subscriptions')) {
            Schema::create('subscriptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('tenant_id');
                $table->foreignId('plan_id')->constrained('plans')->onDelete('restrict');
                $table->enum('status', ['active', 'past_due', 'cancelled', 'trialing'])->default('active');
                $table->timestamp('trial_ends_at')->nullable();
                $table->timestamp('current_period_start')->nullable();
                $table->timestamp('current_period_end')->nullable();
                $table->timestamp('cancelled_at')->nullable();
                $table->string('payment_method')->nullable();
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
