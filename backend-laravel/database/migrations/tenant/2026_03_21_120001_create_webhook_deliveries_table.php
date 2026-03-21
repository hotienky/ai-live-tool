<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')->constrained()->cascadeOnDelete();
            $table->string('event', 100);
            $table->json('payload')->nullable();
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->text('response_body')->nullable();
            $table->unsignedTinyInteger('attempt')->default(1);
            $table->boolean('success')->default(false);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index(['webhook_id', 'created_at']);
            $table->index('event');
        });

        // Upgrade webhooks table
        Schema::table('webhooks', function (Blueprint $table) {
            if (!Schema::hasColumn('webhooks', 'event_types')) {
                $table->json('event_types')->nullable()->after('url');
            }
            if (!Schema::hasColumn('webhooks', 'secret')) {
                $table->string('secret', 64)->nullable()->after('event_types');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
        Schema::table('webhooks', function (Blueprint $table) {
            $table->dropColumn(['event_types', 'secret']);
        });
    }
};
