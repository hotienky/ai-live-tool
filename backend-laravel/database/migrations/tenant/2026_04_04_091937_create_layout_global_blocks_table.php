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
        Schema::create('layout_global_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->string('ref', 100); // e.g. promo_banner_2026
            $table->string('name', 255); // Human readable name
            $table->jsonb('block_json')->default('[]');
            $table->timestamps();
            
            $table->unique(['tenant_id', 'ref']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('layout_global_blocks');
    }
};
