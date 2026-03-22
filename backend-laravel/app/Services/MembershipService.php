<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MembershipRule;
use App\Models\MembershipTier;
use App\Models\PointsTransaction;

class MembershipService
{
    /**
     * Earn points for a member based on an action.
     */
    public function earnPoints(int $memberId, string $action, float $amount = 0, ?string $refType = null, ?int $refId = null): ?PointsTransaction
    {
        $member = Member::find($memberId);
        if (!$member || $member->status !== 'active') return null;

        $rule = MembershipRule::where('action', $action)->where('is_active', true)->first();
        if (!$rule) return null;

        // Calculate points: e.g., 1 point per 10,000₫ → amount=50000, unit=10000, rate=1 → 5 points
        $points = (int) floor(($amount / max($rule->unit_amount, 1)) * $rule->points_per_unit);
        if ($points <= 0) return null;

        // Apply tier multiplier
        if ($member->tier) {
            $points = (int) round($points * ($member->tier->points_multiplier ?? 1));
        }

        // Check conditions (max_points per transaction)
        if ($rule->conditions && isset($rule->conditions['max_points'])) {
            $points = min($points, $rule->conditions['max_points']);
        }

        $member->increment('points', $points);
        $member->increment('points_earned_total', $points);

        $tx = PointsTransaction::create([
            'member_id' => $memberId,
            'type' => 'earn',
            'points' => $points,
            'description' => $rule->description ?? "Tích điểm: {$action}",
            'reference_type' => $refType ?? $action,
            'reference_id' => $refId,
            'balance_after' => $member->fresh()->points,
        ]);

        // Check auto-upgrade
        $this->checkAutoUpgrade($memberId);

        return $tx;
    }

    /**
     * Redeem points.
     */
    public function redeemPoints(int $memberId, int $points, string $description = 'Đổi điểm'): ?PointsTransaction
    {
        $member = Member::find($memberId);
        if (!$member || $member->points < $points) return null;

        $member->decrement('points', $points);
        $member->increment('points_redeemed_total', $points);

        return PointsTransaction::create([
            'member_id' => $memberId,
            'type' => 'redeem',
            'points' => -$points,
            'description' => $description,
            'balance_after' => $member->fresh()->points,
        ]);
    }

    /**
     * Auto-upgrade/downgrade member tier based on total earned points.
     */
    public function checkAutoUpgrade(int $memberId): void
    {
        $member = Member::find($memberId);
        if (!$member) return;

        $totalEarned = $member->points_earned_total ?? 0;

        // Find the highest tier the member qualifies for
        $newTier = MembershipTier::where('is_active', true)
            ->where('min_points', '<=', $totalEarned)
            ->orderBy('min_points', 'desc')
            ->first();

        if ($newTier && $member->tier_id !== $newTier->id) {
            $member->update(['tier_id' => $newTier->id]);
        }
    }

    /**
     * Generate a unique referral code for a member.
     */
    public function generateReferralCode(Member $member): string
    {
        $code = strtoupper(substr(md5($member->id . now()->timestamp), 0, 8));
        $member->update(['referral_code' => $code]);
        return $code;
    }

    /**
     * Process referral — give points to referrer.
     */
    public function processReferral(int $referrerId): void
    {
        $this->earnPoints($referrerId, 'referral', 1, 'referral', null);
    }
}
