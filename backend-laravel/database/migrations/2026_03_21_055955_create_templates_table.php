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
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_id')->unique(); // Slug-like ID ('ecommerce-modern', 'starter')
            $table->string('name');
            $table->unsignedBigInteger('author_id')->nullable(); // Reference to template author
            $table->string('industry')->default('general'); // ecom, blog, lms, booking, etc.
            $table->string('category')->nullable(); // hero, features, etc (for section templates, but this is a full template)
            $table->json('tags')->nullable();
            $table->decimal('price', 10, 0)->default(0); // 0 means Free
            $table->decimal('rating', 2, 1)->default(0);
            $table->integer('install_count')->default(0);
            $table->string('preview_url')->nullable();
            $table->json('screenshots')->nullable(); // Array of URLs
            $table->text('description')->nullable();
            $table->json('features')->nullable(); // Array of strings
            $table->json('requires_modules')->nullable(); // Array of required modules like ['ecom']
            $table->json('theme_config')->nullable(); // Colors, fonts, layout
            $table->json('pages_config')->nullable(); // Predefined sections layout
            $table->json('sample_data')->nullable(); // Predefined products/posts
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->string('version')->default('1.0.0');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
