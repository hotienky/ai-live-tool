<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('reviewable_type');      // product, page, etc.
            $table->unsignedBigInteger('reviewable_id');
            $table->string('author_name');
            $table->string('author_email')->nullable();
            $table->unsignedTinyInteger('rating');    // 1-5
            $table->text('content')->nullable();
            $table->boolean('is_approved')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index(['reviewable_type', 'reviewable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
