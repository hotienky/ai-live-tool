<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('featured_image')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->boolean('is_published')->default(false);
            $table->string('instructor_name')->nullable();
            $table->integer('duration_hours')->nullable();
            $table->string('level')->default('beginner'); // beginner, intermediate, advanced
            $table->integer('lesson_count')->default(0);
            $table->integer('enrollment_count')->default(0);
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('content')->nullable();
            $table->integer('sort_order')->default(0);
            $table->string('video_url')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->boolean('is_free')->default(false);
            $table->timestamps();

            $table->index('course_id');
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('student_name');
            $table->string('student_email')->nullable();
            $table->string('student_phone')->nullable();
            $table->string('status')->default('active'); // active, completed, cancelled
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->integer('progress_percent')->default(0);
            $table->timestamps();

            $table->index(['course_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('courses');
    }
};
