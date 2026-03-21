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
        if (!Schema::hasTable('billing_invoices')) {
            Schema::create('billing_invoices', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('tenant_id');
                $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->onDelete('set null');
                $table->decimal('amount', 10, 0);
                $table->enum('status', ['pending', 'paid', 'failed', 'cancelled'])->default('pending');
                $table->string('payment_method')->nullable();
                $table->string('payment_ref')->nullable();
                $table->timestamp('issued_at')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamp('due_at')->nullable();
                $table->text('notes')->nullable();
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
        Schema::dropIfExists('billing_invoices');
    }
};
