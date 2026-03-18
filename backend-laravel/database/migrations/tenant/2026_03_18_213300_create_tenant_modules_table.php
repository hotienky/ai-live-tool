<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tenant_modules')) return;

        Schema::create('tenant_modules', function (Blueprint $table) {
            $table->id();
            $table->string('module_id', 50)->unique();
            $table->string('version', 20)->default('1.0.0');
            $table->boolean('is_active')->default(true);
            $table->json('config')->nullable();
            $table->timestamp('installed_at')->nullable();
            $table->unsignedBigInteger('installed_by')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_modules');
    }
};
