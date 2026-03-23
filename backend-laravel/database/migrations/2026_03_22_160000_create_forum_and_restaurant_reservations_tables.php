<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('forum_categories')) {
            Schema::create('forum_categories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('slug')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index('shop_id');
            });
        }

        if (!Schema::hasTable('forum_threads')) {
            Schema::create('forum_threads', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->unsignedBigInteger('category_id')->nullable();
                $table->unsignedBigInteger('author_id')->nullable();
                $table->string('author_name')->nullable();
                $table->string('title');
                $table->string('slug')->nullable();
                $table->text('body')->nullable();
                $table->string('status')->default('open'); // open, closed, locked
                $table->boolean('is_pinned')->default(false);
                $table->integer('views_count')->default(0);
                $table->integer('replies_count')->default(0);
                $table->timestamp('last_reply_at')->nullable();
                $table->timestamps();
                $table->index(['shop_id', 'category_id']);
                $table->index('status');
            });
        }

        if (!Schema::hasTable('forum_posts')) {
            Schema::create('forum_posts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->unsignedBigInteger('thread_id');
                $table->unsignedBigInteger('author_id')->nullable();
                $table->string('author_name')->nullable();
                $table->text('body');
                $table->boolean('is_approved')->default(true);
                $table->timestamps();
                $table->index(['thread_id']);
            });
        }

        if (!Schema::hasTable('restaurant_reservations')) {
            Schema::create('restaurant_reservations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->unsignedBigInteger('table_id')->nullable();
                $table->string('customer_name');
                $table->string('customer_phone')->nullable();
                $table->string('customer_email')->nullable();
                $table->integer('party_size')->default(2);
                $table->dateTime('reservation_date');
                $table->string('status')->default('pending'); // pending, confirmed, cancelled, completed, no_show
                $table->text('special_requests')->nullable();
                $table->timestamps();
                $table->index(['shop_id', 'reservation_date']);
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_posts');
        Schema::dropIfExists('forum_threads');
        Schema::dropIfExists('forum_categories');
        Schema::dropIfExists('restaurant_reservations');
    }
};
