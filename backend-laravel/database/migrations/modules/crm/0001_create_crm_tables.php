<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CRM module tables: customers, leads, auto-reply templates.
 * Runs when the CRM module is installed for a tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Customers (CRM / Social) ──
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->string('unique_id')->nullable();
                $table->string('nickname')->nullable();
                $table->string('platform')->nullable();
                $table->integer('total_comments')->default(0);
                $table->integer('hot_count')->default(0);
                $table->string('last_label')->nullable();
                $table->string('phone')->nullable();
                $table->string('email')->nullable();
                $table->text('address')->nullable();
                $table->timestamps();
            });
        }

        // ── Leads ──
        if (!Schema::hasTable('leads')) {
            Schema::create('leads', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('customer_id')->nullable();
                $table->string('unique_id')->nullable();
                $table->string('nickname')->nullable();
                $table->text('comment')->nullable();
                $table->string('label')->nullable();
                $table->string('status')->default('new');
                $table->string('product_intent')->nullable();
                $table->timestamps();

                $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            });
        }

        // ── Auto Reply Templates ──
        if (!Schema::hasTable('auto_reply_templates')) {
            Schema::create('auto_reply_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('trigger_keyword')->nullable();
                $table->text('reply_message');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
        Schema::dropIfExists('auto_reply_templates');
        Schema::dropIfExists('customers');
    }
};
