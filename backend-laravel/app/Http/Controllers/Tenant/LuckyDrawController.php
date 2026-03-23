<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LuckyWheel;
use App\Models\WheelPrize;
use App\Models\WheelSpin;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class LuckyDrawController extends Controller
{
    use ApiResponse;

    // ── Stats Dashboard ──

    public function stats()
    {
        if (!Schema::hasTable('lucky_wheels')) {
            return $this->successResponse([
                'totalCampaigns' => 0,
                'activeCampaigns' => 0,
                'totalParticipants' => 0,
                'totalWinners' => 0,
            ]);
        }

        return $this->successResponse([
            'totalCampaigns'    => LuckyWheel::count(),
            'activeCampaigns'   => LuckyWheel::where('is_active', true)->count(),
            'totalParticipants' => WheelSpin::count(),
            'totalWinners'      => WheelSpin::whereNotNull('prize_id')->count(),
        ]);
    }

    // ── Wheels / Campaigns ──

    public function index()
    {
        if (!Schema::hasTable('lucky_wheels')) {
            return $this->successResponse([]);
        }
        return $this->successResponse(
            LuckyWheel::withCount(['prizes', 'spins'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($w) => $this->mapWheelToCampaign($w))
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
            'background_image' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'max_participants' => 'nullable|integer',
            'max_spins_per_user' => 'nullable|integer',
        ]);

        // Map frontend field names to model fields
        if (isset($data['name']) && !isset($data['title'])) {
            $data['title'] = $data['name'];
        }
        if (isset($data['max_participants']) && !isset($data['max_spins_per_user'])) {
            $data['max_spins_per_user'] = $data['max_participants'];
        }
        unset($data['name'], $data['max_participants']);

        // PostgreSQL strict: cast boolean and clean empty dates
        if (isset($data['is_active'])) {
            $data['is_active'] = (bool) $data['is_active'];
        }
        if (empty($data['start_date'])) $data['start_date'] = null;
        if (empty($data['end_date'])) $data['end_date'] = null;

        $wheel = LuckyWheel::create($data);
        return $this->successResponse($this->mapWheelToCampaign($wheel), 'Đã tạo chiến dịch', 201);
    }

    public function show($id)
    {
        $wheel = LuckyWheel::with('prizes')->withCount('spins')->findOrFail($id);
        return $this->successResponse($this->mapWheelToCampaign($wheel));
    }

    public function update(Request $request, $id)
    {
        $wheel = LuckyWheel::findOrFail($id);
        $data = $request->only(['name', 'title', 'description', 'is_active', 'settings', 'background_image', 'start_date', 'end_date', 'max_participants', 'max_spins_per_user']);

        if (isset($data['name']) && !isset($data['title'])) {
            $data['title'] = $data['name'];
        }
        if (isset($data['max_participants']) && !isset($data['max_spins_per_user'])) {
            $data['max_spins_per_user'] = $data['max_participants'];
        }
        unset($data['name'], $data['max_participants']);

        $wheel->update($data);
        return $this->successResponse($this->mapWheelToCampaign($wheel), 'Đã cập nhật');
    }

    public function destroy($id)
    {
        LuckyWheel::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Prizes ──

    public function prizes($campaignId)
    {
        return $this->successResponse(WheelPrize::where('wheel_id', $campaignId)->orderBy('sort_order')->get());
    }

    public function storePrize(Request $request, $campaignId)
    {
        $data = $request->validate([
            'label' => 'sometimes|string|max:255',
            'name'  => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'probability' => 'nullable|numeric|min:0|max:100',
            'prize_type' => 'sometimes|in:product,coupon,text,nothing',
            'prize_value' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'sort_order' => 'sometimes|integer',
            'quantity' => 'nullable|integer',
            'stock' => 'nullable|integer',
        ]);

        // Map frontend field names
        if (isset($data['name']) && !isset($data['label'])) {
            $data['label'] = $data['name'];
        }
        if (isset($data['quantity']) && !isset($data['stock'])) {
            $data['stock'] = $data['quantity'];
        }
        if (isset($data['description']) && !isset($data['prize_value'])) {
            $data['prize_value'] = $data['description'];
        }
        unset($data['name'], $data['quantity'], $data['description']);

        $data['wheel_id'] = $campaignId;
        return $this->successResponse(WheelPrize::create($data), 'Đã thêm giải thưởng', 201);
    }

    public function updatePrize(Request $request, $campaignId, $id)
    {
        $prize = WheelPrize::where('wheel_id', $campaignId)->findOrFail($id);
        $data = $request->only(['label', 'name', 'description', 'probability', 'prize_type', 'prize_value', 'color', 'sort_order', 'quantity', 'stock']);

        if (isset($data['name']) && !isset($data['label'])) {
            $data['label'] = $data['name'];
        }
        if (isset($data['quantity']) && !isset($data['stock'])) {
            $data['stock'] = $data['quantity'];
        }
        if (isset($data['description']) && !isset($data['prize_value'])) {
            $data['prize_value'] = $data['description'];
        }
        unset($data['name'], $data['quantity'], $data['description']);

        $prize->update($data);
        return $this->successResponse($prize, 'Đã cập nhật');
    }

    public function destroyPrize($campaignId, $id)
    {
        WheelPrize::where('wheel_id', $campaignId)->findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Draw ──

    public function draw($campaignId)
    {
        $wheel = LuckyWheel::with('prizes')->findOrFail($campaignId);

        if (!$wheel->is_active) {
            return $this->errorResponse('Chiến dịch chưa kích hoạt', 422);
        }

        $prizes = $wheel->prizes->where('stock', '>', 0)->merge(
            $wheel->prizes->whereNull('stock')
        );

        if ($prizes->isEmpty()) {
            return $this->errorResponse('Không có giải thưởng khả dụng', 422);
        }

        // Weighted random selection
        $totalWeight = $prizes->sum('probability') ?: $prizes->count();
        $rand = mt_rand(0, (int)($totalWeight * 100)) / 100;
        $cumulative = 0;
        $selectedPrize = $prizes->last();

        foreach ($prizes as $prize) {
            $cumulative += $prize->probability ?: ($totalWeight / $prizes->count());
            if ($rand <= $cumulative) {
                $selectedPrize = $prize;
                break;
            }
        }

        // Record the spin
        $spin = WheelSpin::create([
            'wheel_id' => $campaignId,
            'prize_id' => $selectedPrize->id,
            'won_at' => now(),
        ]);

        // Decrement stock if applicable
        if ($selectedPrize->stock !== null) {
            $selectedPrize->decrement('stock');
            $selectedPrize->increment('redeemed_count');
        }

        $wheel->increment('spin_count');

        return $this->successResponse([
            'spin_id' => $spin->id,
            'winner_name' => $spin->customer_name,
            'prize_name' => $selectedPrize->label,
            'prize' => $selectedPrize,
        ]);
    }

    // ── Spins (history) ──

    public function spins(Request $request, $campaignId)
    {
        return $this->successResponse(
            WheelSpin::with('prize')->where('wheel_id', $campaignId)
                ->orderBy('won_at', 'desc')
                ->paginate($request->input('per_page', 20))
        );
    }

    // ── Helpers ──

    /**
     * Map internal LuckyWheel model to "campaign" format expected by frontend.
     */
    private function mapWheelToCampaign($wheel)
    {
        $data = $wheel->toArray();
        $data['name'] = $data['title'] ?? '';
        $data['max_participants'] = $data['max_spins_per_user'] ?? null;
        $data['participants_count'] = $data['spins_count'] ?? $wheel->spin_count ?? 0;
        $data['settings'] = $data['settings'] ?? [];
        $data['background_image'] = $data['background_image'] ?? '';
        return $data;
    }
}
