<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('content_translations')) {
            Schema::create('content_translations', function (Blueprint $table) {
                $table->id();
                $table->string('translatable_type', 50); // 'products', 'categories', 'cms_pages'
                $table->unsignedBigInteger('translatable_id');
                $table->string('locale', 10); // 'en', 'ja', 'ko'
                $table->string('field', 100); // 'name', 'description', 'content'
                $table->text('value')->nullable();
                $table->timestamps();

                $table->unique(
                    ['translatable_type', 'translatable_id', 'locale', 'field'],
                    'content_trans_unique'
                );
                $table->index(['translatable_type', 'translatable_id', 'locale'], 'content_trans_lookup');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('content_translations');
    }
};
