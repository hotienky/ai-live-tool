<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('purchase_orders')) return;

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number', 50)->unique();
            $table->unsignedBigInteger('supplier_id');
            $table->json('items');
            // [{product_id, product_name, variant_id, sku, qty, received_qty, unit_price, total}]
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'ordered', 'partial', 'received', 'cancelled'])->default('draft');
            $table->date('order_date');
            $table->date('expected_date')->nullable();
            $table->date('received_date')->nullable();
            $table->string('payment_status', 30)->default('unpaid'); // unpaid, partial, paid
            $table->text('notes')->nullable();
            $table->text('shipping_address')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('supplier_id');
            $table->index(['status', 'order_date']);
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
