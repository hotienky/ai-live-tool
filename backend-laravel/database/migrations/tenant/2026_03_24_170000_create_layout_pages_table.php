<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('layout_pages', function (Blueprint $t) {
            $t->id();
            $t->string('slug', 100)->unique()->default('home');
            $t->string('title', 255)->nullable();
            $t->jsonb('layout_json')->default('[]');
            $t->string('status', 20)->default('published'); // draft | published
            $t->integer('version')->default(1);
            $t->boolean('is_system')->default(false);
            $t->jsonb('meta')->nullable(); // theme overrides, SEO, etc.
            $t->timestamps();
        });

        Schema::create('layout_page_versions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('page_id')->constrained('layout_pages')->onDelete('cascade');
            $t->jsonb('layout_json');
            $t->integer('version');
            $t->string('published_by', 100)->nullable();
            $t->string('note', 500)->nullable();
            $t->timestamp('created_at')->useCurrent();

            $t->index(['page_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('layout_page_versions');
        Schema::dropIfExists('layout_pages');
    }
};
