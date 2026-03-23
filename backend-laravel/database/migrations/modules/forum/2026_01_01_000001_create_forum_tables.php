<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('forum_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('forum_categories')->cascadeOnDelete();
            $table->string('title');
            $table->text('body')->nullable();
            $table->unsignedBigInteger('author_id')->nullable();
            $table->string('author_name')->nullable();
            $table->string('status')->default('open'); // open, closed, locked
            $table->boolean('is_pinned')->default(false);
            $table->unsignedInteger('replies_count')->default(0);
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();

            $table->index(['category_id', 'status']);
            $table->index('is_pinned');
        });

        Schema::create('forum_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('forum_threads')->cascadeOnDelete();
            $table->unsignedBigInteger('author_id')->nullable();
            $table->string('author_name')->nullable();
            $table->text('body');
            $table->timestamps();

            $table->index('thread_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_posts');
        Schema::dropIfExists('forum_threads');
        Schema::dropIfExists('forum_categories');
    }
};
