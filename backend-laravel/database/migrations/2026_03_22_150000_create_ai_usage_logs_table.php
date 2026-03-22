<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id', 50)->index();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action', 30)->index(); // seo, translate, blog, product, sales, tags, general
            $table->string('provider', 20)->default('openai'); // openai, anthropic
            $table->string('model', 50)->default('gpt-4o-mini');
            $table->string('key_mode', 10)->default('system'); // own, system
            $table->integer('prompt_tokens')->default(0);
            $table->integer('completion_tokens')->default(0);
            $table->integer('total_tokens')->default(0);
            $table->decimal('estimated_cost', 10, 6)->default(0); // USD
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
    }
};
