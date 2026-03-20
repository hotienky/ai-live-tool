<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('media')) {
            Schema::create('media', function (Blueprint $table) {
                $table->id();
                $table->string('filename');          // original filename
                $table->string('disk', 20)->default('public');
                $table->string('path');              // relative path: media/{tenant}/{Y}/{m}/file.jpg
                $table->string('mime_type', 100);
                $table->unsignedInteger('size')->default(0);  // bytes
                $table->unsignedInteger('width')->nullable();
                $table->unsignedInteger('height')->nullable();
                $table->string('alt')->nullable();
                $table->string('title')->nullable();
                $table->json('thumbnails')->nullable();  // {"thumb":"path","medium":"path"}
                $table->json('metadata')->nullable();    // EXIF, extra info
                $table->timestamps();

                $table->index('mime_type');
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
