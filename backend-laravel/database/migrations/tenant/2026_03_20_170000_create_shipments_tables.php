<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Only create shipments if orders table exists (ecom module installed)
        if (!Schema::hasTable('shipments') && Schema::hasTable('orders')) {
            Schema::create('shipments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id')->nullable()->index();
                $table->string('carrier', 30)->default('manual');
                $table->string('tracking_code', 50)->nullable()->unique();
                $table->string('carrier_order_code', 100)->nullable();

                // Receiver info
                $table->string('receiver_name');
                $table->string('receiver_phone', 20);
                $table->text('receiver_address');
                $table->string('receiver_ward', 100)->nullable();
                $table->string('receiver_district', 100)->nullable();
                $table->string('receiver_province', 100)->nullable();

                // Fees
                $table->decimal('shipping_fee', 12, 2)->default(0);
                $table->decimal('cod_amount', 12, 2)->default(0);
                $table->integer('weight')->default(500);
                $table->decimal('insurance_fee', 12, 2)->default(0);

                $table->text('notes')->nullable();
                $table->string('status', 30)->default('draft');

                $table->timestamp('delivered_at')->nullable();
                $table->timestamps();

                $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('shipment_history') && Schema::hasTable('shipments')) {
            Schema::create('shipment_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shipment_id')->index();
                $table->string('status', 30);
                $table->text('description')->nullable();
                $table->string('location')->nullable();
                $table->string('source', 30)->default('admin');
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('shipment_id')->references('id')->on('shipments')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_history');
        Schema::dropIfExists('shipments');
    }
};
