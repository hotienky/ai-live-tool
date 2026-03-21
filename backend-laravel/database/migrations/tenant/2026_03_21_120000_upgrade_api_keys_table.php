<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('api_keys', function (Blueprint $table) {
            $table->enum('type', ['public', 'secret'])->default('public')->after('key');
            $table->integer('rate_limit')->default(1000)->after('type'); // requests/hour
            $table->timestamp('last_used_at')->nullable()->after('rate_limit');
            $table->unsignedBigInteger('usage_count')->default(0)->after('last_used_at');
            $table->json('allowed_origins')->nullable()->after('usage_count');
        });
    }

    public function down(): void
    {
        Schema::table('api_keys', function (Blueprint $table) {
            $table->dropColumn(['type', 'rate_limit', 'last_used_at', 'usage_count', 'allowed_origins']);
        });
    }
};
