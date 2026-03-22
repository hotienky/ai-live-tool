<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Job applications
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_id'); // content_id (job type)
            $table->string('applicant_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('resume_url')->nullable();
            $table->text('cover_letter')->nullable();
            $table->string('status')->default('new'); // new, reviewing, shortlisted, interviewed, rejected, hired
            $table->jsonb('extra_info')->nullable(); // experience, expected salary, etc.
            $table->text('admin_notes')->nullable();
            $table->integer('rating')->nullable(); // 1-5 star rating by admin
            $table->timestamp('applied_at')->useCurrent();
            $table->timestamps();

            $table->index(['job_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
