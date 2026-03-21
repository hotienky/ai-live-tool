<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Generic contents table ──
        Schema::create('contents', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->index();         // 'post', 'course', 'listing', 'page'
            $table->string('slug')->index();
            $table->string('title');
            $table->longText('body')->nullable();
            $table->string('excerpt', 500)->nullable();
            $table->string('featured_image')->nullable();
            $table->string('status', 20)->default('draft'); // draft, published, archived
            $table->unsignedBigInteger('author_id')->nullable();
            $table->jsonb('meta')->nullable();             // flexible field storage
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['type', 'slug']);
        });

        // ── Taxonomy assignments (categories, tags, etc.) ──
        Schema::create('content_taxonomies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('contents')->cascadeOnDelete();
            $table->string('taxonomy', 50);   // 'category', 'tag', custom
            $table->string('term');
            $table->timestamps();

            $table->index(['taxonomy', 'term']);
            $table->unique(['content_id', 'taxonomy', 'term']);
        });

        // ── Revision history ──
        Schema::create('content_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('contents')->cascadeOnDelete();
            $table->string('title');
            $table->longText('body')->nullable();
            $table->jsonb('meta')->nullable();
            $table->unsignedBigInteger('revised_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_revisions');
        Schema::dropIfExists('content_taxonomies');
        Schema::dropIfExists('contents');
    }
};
