<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;


use App\Repositories\Coupon\CouponRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CouponsController extends Controller
{
    use ApiResponse;

    public function __construct(private CouponRepositoryInterface $repo) {}

    public function index()
    {
        $coupons = $this->repo->query()->orderByDesc('created_at')->get();
        // Normalize column names → consistent camelCase JSON output
        $mapped = $coupons->map(function ($c) {
            return [
                'id' => $c->id,
                'code' => $c->code,
                'type' => $c->type === 'percentage' ? 'percent' : ($c->type ?: 'percent'),
                'value' => $c->value ?? 0,
                'minOrder' => $c->min_order ?? $c->min_order_amount ?? 0,
                'maxUses' => $c->max_uses ?? $c->usage_limit ?? null,
                'usedCount' => $c->used_count ?? $c->times_used ?? 0,
                'dateStart' => $c->date_start ?? $c->start_date ?? null,
                'dateEnd' => $c->date_end ?? $c->end_date ?? $c->expires_at ?? null,
                'created_at' => $c->created_at,
                'updated_at' => $c->updated_at,
            ];
        });
        return $this->successResponse($mapped);
    }

    private function mapCouponFields(Request $request): array
    {
        $type = $request->input('type', 'percent');
        // Map frontend "percent" → DB "percentage" if needed
        return [
            'code' => strtoupper($request->input('code', '')),
            'type' => $type,
            'value' => $request->input('value', 0),
            'min_order' => $request->input('minOrder') ?? $request->input('min_order', 0),
            'min_order_amount' => $request->input('minOrder') ?? $request->input('min_order_amount', 0),
            'max_uses' => $request->input('maxUses') ?? $request->input('max_uses'),
            'usage_limit' => $request->input('maxUses') ?? $request->input('usage_limit'),
            'date_start' => $request->input('dateStart') ?: ($request->input('date_start') ?: null),
            'date_end' => $request->input('dateEnd') ?: ($request->input('date_end') ?: null),
            'expires_at' => $request->input('dateEnd') ?: ($request->input('expires_at') ?: null),
        ];
    }

    public function store(Request $request)
    {
        try {
            $data = $this->mapCouponFields($request);
            if (empty($data['code'])) return $this->errorResponse('Chưa nhập mã code');
            $coupon = $this->repo->store($data);
            return $this->successResponse($coupon, 'Đã tạo mã giảm giá', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $this->mapCouponFields($request);
            $this->repo->update($data, $id);
            return $this->successResponse($this->repo->findOne($id), 'Đã cập nhật');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        $this->repo->delete($id);
        return $this->successResponse(null, 'Đã xóa mã giảm giá');
    }

    public function validate(Request $request)
    {
        $result = $this->repo->validateCoupon(
            $request->input('code'),
            $request->input('order_total', 0)
        );
        return $this->successResponse($result);
    }
}
