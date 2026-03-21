<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Keywords used to classify HOT/WARM leads
        if (!Schema::hasTable('shop_keywords')) {
            Schema::create('shop_keywords', function (Blueprint $table) {
                $table->id();
                $table->string('keyword');
                $table->string('label', 20)->default('[HOT]'); // [HOT] | [WARM]
                $table->string('color', 20)->nullable();
                $table->timestamps();
            });
        }

        // Live sessions (one per shop livestream)
        if (!Schema::hasTable('livestream_sessions')) {
            Schema::create('livestream_sessions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_id')->index();
                $table->string('platform', 30)->default('tiktok'); // tiktok | facebook | youtube | shopee
                $table->string('stream_url')->nullable();
                $table->string('status', 20)->default('active'); // active | ended
                $table->unsignedInteger('total_comments')->default(0);
                $table->unsignedInteger('hot_leads')->default(0);
                $table->unsignedInteger('warm_leads')->default(0);
                $table->unsignedInteger('cold_leads')->default(0);
                $table->unsignedInteger('peak_viewers')->default(0);
                $table->timestamp('started_at')->nullable();
                $table->timestamp('ended_at')->nullable();
                $table->timestamps();

                $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
            });
        }

        // Individual chat messages from livestream
        if (!Schema::hasTable('chat_logs')) {
            Schema::create('chat_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('session_id')->index();
                $table->string('nickname');
                $table->string('unique_id')->nullable();
                $table->string('profile_picture_url')->nullable();
                $table->text('comment');
                $table->string('ai_label', 20)->nullable(); // [HOT] | [WARM] | [COLD] | null
                $table->json('matched_product')->nullable();
                $table->timestamp('received_at')->nullable();
                $table->timestamps();

                $table->foreign('session_id')->references('id')->on('livestream_sessions')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_logs');
        Schema::dropIfExists('livestream_sessions');
        Schema::dropIfExists('shop_keywords');
    }
};
