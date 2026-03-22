<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\MembershipTier;
use App\Models\Member;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MembershipController extends Controller
{
    use ApiResponse;

    // ── Tiers ──

    public function tiers()
    {
        return $this->successResponse(MembershipTier::withCount('members')->orderBy('sort_order')->get());
    }

    public function storeTier(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'min_points' => 'integer|min:0',
            'discount_percent' => 'numeric|min:0|max:100',
            'benefits' => 'nullable|array',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);
        $data['slug'] = Str::slug($data['name']);
        return $this->successResponse(MembershipTier::create($data), 'Đã tạo cấp thành viên', 201);
    }

    public function showTier($id)
    {
        return $this->successResponse(MembershipTier::withCount('members')->findOrFail($id));
    }

    public function updateTier(Request $request, $id)
    {
        $tier = MembershipTier::findOrFail($id);
        $tier->update($request->only(['name', 'description', 'min_points', 'discount_percent', 'benefits', 'color', 'icon', 'is_active', 'sort_order']));
        return $this->successResponse($tier, 'Đã cập nhật');
    }

    public function destroyTier($id)
    {
        MembershipTier::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Members ──

    public function members(Request $request)
    {
        $query = Member::with('tier');
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        if ($tierId = $request->input('tier_id')) $query->where('tier_id', $tierId);
        if ($status = $request->input('status')) $query->where('status', $status);
        return $this->successResponse($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20)));
    }

    public function storeMember(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'tier_id' => 'nullable|exists:membership_tiers,id',
            'points' => 'integer|min:0',
        ]);
        return $this->successResponse(Member::create($data), 'Đã thêm thành viên', 201);
    }

    public function showMember($id)
    {
        return $this->successResponse(Member::with('tier')->findOrFail($id));
    }

    public function updateMember(Request $request, $id)
    {
        $member = Member::findOrFail($id);
        $member->update($request->only(['name', 'email', 'phone', 'tier_id', 'points', 'total_spent', 'status', 'expires_at']));
        return $this->successResponse($member->load('tier'), 'Đã cập nhật');
    }

    public function destroyMember($id)
    {
        Member::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Points Transactions ──

    public function transactions(Request $request)
    {
        $query = \App\Models\PointsTransaction::with('member');
        if ($memberId = $request->input('member_id')) $query->where('member_id', $memberId);
        if ($type = $request->input('type')) $query->where('type', $type);
        return $this->successResponse($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20)));
    }

    public function adjustPoints(Request $request, $id)
    {
        $data = $request->validate([
            'points' => 'required|integer',
            'description' => 'required|string|max:255',
        ]);

        $member = Member::findOrFail($id);
        $member->increment('points', $data['points']);
        if ($data['points'] > 0) $member->increment('points_earned_total', $data['points']);
        else $member->increment('points_redeemed_total', abs($data['points']));

        \App\Models\PointsTransaction::create([
            'member_id' => $id,
            'type' => $data['points'] > 0 ? 'adjust' : 'redeem',
            'points' => $data['points'],
            'description' => $data['description'],
            'reference_type' => 'manual',
            'balance_after' => $member->fresh()->points,
        ]);

        app(\App\Services\MembershipService::class)->checkAutoUpgrade($id);

        return $this->successResponse($member->fresh()->load('tier'), 'Đã cập nhật điểm');
    }

    // ── Earning Rules ──

    public function rules()
    {
        return $this->successResponse(\App\Models\MembershipRule::orderBy('action')->get());
    }

    public function storeRule(Request $request)
    {
        $data = $request->validate([
            'action' => 'required|string|max:50',
            'points_per_unit' => 'numeric|min:0',
            'unit_amount' => 'numeric|min:0.01',
            'conditions' => 'nullable|array',
            'is_active' => 'boolean',
            'description' => 'nullable|string|max:255',
        ]);
        return $this->successResponse(\App\Models\MembershipRule::create($data), 'Đã tạo quy tắc', 201);
    }

    public function updateRule(Request $request, $id)
    {
        $rule = \App\Models\MembershipRule::findOrFail($id);
        $rule->update($request->only(['action', 'points_per_unit', 'unit_amount', 'conditions', 'is_active', 'description']));
        return $this->successResponse($rule, 'Đã cập nhật');
    }

    public function destroyRule($id)
    {
        \App\Models\MembershipRule::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Stats Dashboard ──

    public function stats()
    {
        $totalMembers = Member::count();
        $activeMembers = Member::where('status', 'active')->count();
        $totalPointsIssued = \App\Models\PointsTransaction::where('type', 'earn')->sum('points');
        $totalPointsRedeemed = abs(\App\Models\PointsTransaction::where('type', 'redeem')->sum('points'));
        $membersByTier = MembershipTier::withCount('members')->orderBy('sort_order')->get(['id', 'name', 'color']);
        $recentTransactions = \App\Models\PointsTransaction::with('member')->orderBy('created_at', 'desc')->limit(10)->get();

        return $this->successResponse(compact(
            'totalMembers', 'activeMembers', 'totalPointsIssued', 'totalPointsRedeemed', 'membersByTier', 'recentTransactions'
        ));
    }
}
