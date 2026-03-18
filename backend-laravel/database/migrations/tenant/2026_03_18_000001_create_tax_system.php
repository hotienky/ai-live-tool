<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tax Rates table
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->string('name');              // VD: "VAT 10%", "Thuế TTĐB 5%"
            $table->string('code')->unique();    // VD: "vat_10", "luxury_5"
            $table->decimal('rate', 8, 4);       // VD: 10.0000 = 10%
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->enum('scope', ['global', 'category', 'product', 'region'])->default('global');
            $table->json('applies_to')->nullable();  // category_ids, product_ids, province_ids
            $table->boolean('is_compound')->default(false); // thuế chồng thuế
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Add tax columns to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('subtotal', 15, 2)->default(0)->after('total_amount');
            $table->decimal('tax_amount', 15, 2)->default(0)->after('subtotal');
            $table->json('tax_details')->nullable()->after('tax_amount');
        });

        // 3. Add tax_class to products
        Schema::table('products', function (Blueprint $table) {
            $table->string('tax_class', 50)->default('default')->after('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_rates');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'tax_amount', 'tax_details']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('tax_class');
        });
    }
};
