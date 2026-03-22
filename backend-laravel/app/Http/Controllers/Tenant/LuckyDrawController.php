<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LuckyWheel;
use App\Models\WheelPrize;
use App\Models\WheelSpin;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class LuckyDrawController extends Controller
{
    use ApiResponse;

    // ── Wheels ──

    public function index()
    {
        return $this->successResponse(LuckyWheel::withCount(['prizes', 'spins'])->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);
        return $this->successResponse(LuckyWheel::create($data), 'Đã tạo vòng quay', 201);
    }

    public function show($id)
    {
        return $this->successResponse(LuckyWheel::with('prizes')->withCount('spins')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $wheel = LuckyWheel::findOrFail($id);
        $wheel->update($request->only(['title', 'is_active', 'settings']));
        return $this->successResponse($wheel, 'Đã cập nhật');
    }

    public function destroy($id)
    {
        LuckyWheel::findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Prizes ──

    public function prizes($wheelId)
    {
        return $this->successResponse(WheelPrize::where('wheel_id', $wheelId)->orderBy('sort_order')->get());
    }

    public function storePrize(Request $request, $wheelId)
    {
        $data = $request->validate([
            'label' => 'required|string|max:255',
            'probability' => 'numeric|min:0|max:100',
            'prize_type' => 'in:product,coupon,text,nothing',
            'prize_value' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'sort_order' => 'integer',
        ]);
        $data['wheel_id'] = $wheelId;
        return $this->successResponse(WheelPrize::create($data), 'Đã thêm giải thưởng', 201);
    }

    public function updatePrize(Request $request, $wheelId, $id)
    {
        $prize = WheelPrize::where('wheel_id', $wheelId)->findOrFail($id);
        $prize->update($request->only(['label', 'probability', 'prize_type', 'prize_value', 'color', 'sort_order']));
        return $this->successResponse($prize, 'Đã cập nhật');
    }

    public function destroyPrize($wheelId, $id)
    {
        WheelPrize::where('wheel_id', $wheelId)->findOrFail($id)->delete();
        return $this->successResponse(null, 'Đã xoá');
    }

    // ── Spins (history) ──

    public function spins(Request $request, $wheelId)
    {
        return $this->successResponse(
            WheelSpin::with('prize')->where('wheel_id', $wheelId)
                ->orderBy('won_at', 'desc')
                ->paginate($request->input('per_page', 20))
        );
    }
}
