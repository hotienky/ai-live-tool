<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('master')->create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('module_id')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->default('Package');
            $table->string('category')->default('other');
            $table->string('version')->default('1.0.0');
            $table->decimal('price', 12, 0)->default(0); // VNĐ, 0 = miễn phí
            $table->boolean('is_active')->default(true);
            $table->json('sidebar')->nullable();
            $table->json('requires')->nullable();
            $table->json('config')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('master')->dropIfExists('modules');
    }
};
