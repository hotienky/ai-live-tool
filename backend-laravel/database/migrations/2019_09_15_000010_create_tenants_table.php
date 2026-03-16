<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTenantsTable extends Migration
{
    /**
     * Run the migrations.
     * Customized for existing project — maps to existing tenants table schema.
     */
    public function up(): void
    {
        Schema::connection('master')->create('tenants', function (Blueprint $table) {
            $table->string('id')->primary();

            // Custom columns matching existing schema
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('db_name');
            $table->string('status')->default('active'); // active, suspended
            $table->string('plan')->nullable();
            $table->json('data')->nullable(); // stancl/tenancy data column

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('master')->dropIfExists('tenants');
    }
}
