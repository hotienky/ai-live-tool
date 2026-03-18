<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nhà cung cấp
        if (!Schema::hasTable('suppliers')) {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('tax_id', 50)->nullable();
            $table->string('contact_person')->nullable();
            $table->integer('payment_terms')->default(0); // days
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        }

        // Phiếu nhập/xuất kho
        if (!Schema::hasTable('stock_receipts')) {
        Schema::create('stock_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number', 50)->unique();
            $table->enum('type', ['import', 'export', 'return', 'adjust'])->index();
            // import = nhập kho, export = xuất kho, return = trả hàng NCC, adjust = kiểm kê
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->json('items');
            // [{product_id, product_name, variant_id, sku, qty, unit_price, total}]
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'confirmed', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->string('reference_type', 50)->nullable(); // 'order', 'purchase_order'
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index('supplier_id');
            $table->index(['reference_type', 'reference_id']);
        });
        }

        // Phiếu thu/chi
        if (!Schema::hasTable('payment_vouchers')) {
        Schema::create('payment_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_number', 50)->unique();
            $table->enum('type', ['receipt', 'payment'])->index();
            // receipt = phiếu thu, payment = phiếu chi
            $table->decimal('amount', 15, 2);
            $table->string('category', 100);
            $table->text('description')->nullable();
            $table->string('payment_method', 50)->default('cash');
            // cash, bank, wallet, other
            $table->string('counterparty')->nullable(); // đối tác
            $table->enum('status', ['draft', 'confirmed', 'cancelled'])->default('draft');
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->date('voucher_date');
            $table->dateTime('confirmed_at')->nullable();
            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index('voucher_date');
        });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_vouchers');
        Schema::dropIfExists('stock_receipts');
        Schema::dropIfExists('suppliers');
    }
};
