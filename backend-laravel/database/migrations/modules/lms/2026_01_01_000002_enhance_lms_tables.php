<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Course sections (chapters)
        Schema::create('course_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Add section_id to lessons
        if (!Schema::hasColumn('lessons', 'section_id')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->unsignedBigInteger('section_id')->nullable()->after('course_id');
                $table->boolean('is_locked')->default(false)->after('is_free');
                $table->date('unlock_date')->nullable()->after('is_locked');
            });
        }

        // Quizzes
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->integer('passing_score')->default(70); // percentage
            $table->integer('time_limit_minutes')->nullable();
            $table->integer('max_attempts')->nullable();
            $table->boolean('shuffle_questions')->default(false);
            $table->timestamps();
        });

        // Quiz questions
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->string('type')->default('multiple_choice'); // multiple_choice, true_false, text, multi_select
            $table->jsonb('options')->nullable(); // ["Option A", "Option B", ...]
            $table->jsonb('correct_answer'); // "A" or ["A","C"] for multi_select
            $table->integer('sort_order')->default(0);
            $table->integer('points')->default(1);
            $table->text('explanation')->nullable(); // shown after answering
            $table->timestamps();
        });

        // Quiz attempts
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->jsonb('answers')->nullable(); // { "q_1": "A", "q_2": "C" }
            $table->integer('score')->default(0); // percentage
            $table->integer('correct_count')->default(0);
            $table->integer('total_questions')->default(0);
            $table->boolean('passed')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['quiz_id', 'enrollment_id']);
        });

        // Lesson progress tracking
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->timestamp('completed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['enrollment_id', 'lesson_id']);
        });

        // Certificates
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('certificate_number')->unique();
            $table->string('student_name');
            $table->string('course_title');
            $table->timestamp('issued_at')->useCurrent();
            $table->jsonb('template')->nullable(); // custom template data
            $table->timestamps();
        });

        // Enhance courses
        if (!Schema::hasColumn('courses', 'certificate_enabled')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->boolean('certificate_enabled')->default(false)->after('enrollment_count');
                $table->string('certificate_template')->nullable()->after('certificate_enabled');
                $table->unsignedBigInteger('prerequisite_id')->nullable()->after('certificate_template');
            });
        }
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['certificate_enabled', 'certificate_template', 'prerequisite_id']);
        });
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
        Schema::dropIfExists('course_sections');
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['section_id', 'is_locked', 'unlock_date']);
        });
    }
};
