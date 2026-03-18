<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add min_stock to products if not exists
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'min_stock')) {
            Schema::table('products', function (Blueprint $table) {
                $table->integer('min_stock')->default(5)->after('stock');
            });
        }

        // Add stock_histories table if not exists (for tracking stock changes)
        if (!Schema::hasTable('stock_histories')) {
            Schema::create('stock_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_id');
                $table->string('action', 20); // add, deduct, adjust
                $table->integer('quantity_change');
                $table->integer('stock_before');
                $table->integer('stock_after');
                $table->string('reason')->nullable();
                $table->timestamps();
                $table->index('product_id');
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'min_stock')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('min_stock');
            });
        }
        Schema::dropIfExists('stock_histories');
    }
};
