<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenant_content_types', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('type_key')->index(); // e.g., 'portfolio', 'faq'
            $table->string('name'); // e.g., 'Portfolios', 'FAQs'
            $table->string('singular_name'); // e.g., 'Portfolio', 'FAQ'
            $table->string('icon')->default('FileText');
            $table->jsonb('supports')->nullable(); // e.g., ['title', 'body', 'featured_image']
            $table->jsonb('meta_fields')->nullable(); // custom fields array
            $table->boolean('has_revisions')->default(true);
            $table->boolean('has_comments')->default(false);
            $table->timestamps();

            // tenant_id and type_key should be unique together
            $table->unique(['tenant_id', 'type_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_content_types');
    }
};
