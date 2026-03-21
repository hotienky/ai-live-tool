<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('content_id')->index();
            $table->string('author_name');
            $table->string('author_email')->nullable();
            $table->text('body');
            $table->string('status', 20)->default('pending'); // pending, approved, spam
            $table->unsignedBigInteger('parent_id')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('content_id')->references('id')->on('contents')->cascadeOnDelete();
            $table->foreign('parent_id')->references('id')->on('comments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
