<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Event ticket types
        Schema::create('event_tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id'); // content_id (event type)
            $table->string('name'); // VIP, Regular, Free
            $table->decimal('price', 12, 2)->default(0);
            $table->integer('quantity')->nullable(); // null = unlimited
            $table->integer('sold_count')->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('event_id');
        });

        // Event registrations / attendees
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('ticket_id')->nullable();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('status')->default('registered'); // registered, confirmed, checked_in, cancelled
            $table->string('registration_code')->unique();
            $table->timestamp('checked_in_at')->nullable();
            $table->jsonb('extra_info')->nullable(); // custom fields
            $table->timestamps();

            $table->index(['event_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
        Schema::dropIfExists('event_tickets');
    }
};
