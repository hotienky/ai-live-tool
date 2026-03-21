    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        public function up(): void
        {
            if (Schema::connection('master')->hasTable('tenant_module_subscriptions')) return;
            Schema::connection('master')->create('tenant_module_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('tenant_id');
                $table->string('module_id');
                $table->boolean('is_active')->default(true);
                $table->timestamp('installed_at')->nullable();
                $table->unsignedBigInteger('installed_by')->nullable();
                $table->timestamps();

                $table->unique(['tenant_id', 'module_id']);
                $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                $table->foreign('module_id')->references('module_id')->on('modules')->cascadeOnDelete();
            });
        }

        public function down(): void
        {
            Schema::connection('master')->dropIfExists('tenant_module_subscriptions');
        }
    };
