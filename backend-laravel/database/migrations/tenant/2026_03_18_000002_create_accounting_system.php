<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Accounting Entries (sổ thu chi)
        Schema::create('accounting_entries', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['revenue', 'expense', 'adjustment'])->index();
            $table->string('category', 100)->index();
            // Categories: order_revenue, shipping_cost, refund, tax,
            //             marketing, salary, rent, supplies, other
            $table->decimal('amount', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->string('reference_type', 50)->nullable(); // 'order', 'refund', 'manual'
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->date('entry_date')->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['entry_date', 'type']);
            $table->index(['reference_type', 'reference_id']);
        });

        // Invoices (hóa đơn)
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('customer_name');
            $table->string('customer_phone', 20)->nullable();
            $table->string('customer_address')->nullable();
            $table->string('customer_email')->nullable();
            $table->json('items');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->json('tax_details')->nullable();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'issued', 'paid', 'cancelled'])->default('draft');
            $table->dateTime('issued_at')->nullable();
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('accounting_entries');
    }
};
