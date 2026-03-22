<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Points transaction history
        Schema::create('points_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // earn, redeem, expire, adjust, bonus
            $table->integer('points');
            $table->string('description')->nullable();
            $table->string('reference_type')->nullable(); // order, review, referral, signup, birthday, manual
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->integer('balance_after')->default(0); // snapshot
            $table->timestamps();

            $table->index(['member_id', 'type']);
            $table->index('reference_type');
        });

        // Membership earning rules
        Schema::create('membership_rules', function (Blueprint $table) {
            $table->id();
            $table->string('action'); // purchase, review, referral, signup, birthday, checkin
            $table->decimal('points_per_unit', 10, 2)->default(1); // e.g., 1 point per 10,000₫
            $table->decimal('unit_amount', 14, 2)->default(1); // every X amount triggers points
            $table->jsonb('conditions')->nullable(); // {"min_order": 100000, "max_points": 500}
            $table->boolean('is_active')->default(true);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Enhance membership_tiers
        if (!Schema::hasColumn('membership_tiers', 'max_points')) {
            Schema::table('membership_tiers', function (Blueprint $table) {
                $table->integer('max_points')->nullable()->after('min_points'); // null = no cap
                $table->decimal('points_multiplier', 4, 2)->default(1.0)->after('discount_percent'); // VIP earns 2x
            });
        }

        // Enhance members
        if (!Schema::hasColumn('members', 'referral_code')) {
            Schema::table('members', function (Blueprint $table) {
                $table->string('referral_code')->nullable()->unique()->after('phone');
                $table->unsignedBigInteger('referred_by')->nullable()->after('referral_code');
                $table->integer('points_earned_total')->default(0)->after('points'); // lifetime
                $table->integer('points_redeemed_total')->default(0)->after('points_earned_total');
                $table->date('birthday')->nullable()->after('expires_at');
            });
        }
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['referral_code', 'referred_by', 'points_earned_total', 'points_redeemed_total', 'birthday']);
        });
        Schema::table('membership_tiers', function (Blueprint $table) {
            $table->dropColumn(['max_points', 'points_multiplier']);
        });
        Schema::dropIfExists('membership_rules');
        Schema::dropIfExists('points_transactions');
    }
};
