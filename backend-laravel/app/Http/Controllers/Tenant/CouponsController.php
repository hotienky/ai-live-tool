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
        // Map snake_case → camelCase for frontend
        $mapped = $coupons->map(function ($c) {
            $c->minOrder = $c->min_order ?? $c->min_order_amount ?? 0;
            $c->maxUses = $c->max_uses ?? null;
            $c->usedCount = $c->used_count ?? 0;
            $c->dateStart = $c->date_start ?? $c->start_date ?? null;
            $c->dateEnd = $c->date_end ?? $c->end_date ?? null;
            return $c;
        });
        return $this->successResponse($mapped);
    }

    private function mapCouponFields(Request $request): array
    {
        return [
            'code' => strtoupper($request->input('code', '')),
            'type' => $request->input('type', 'percent'),
            'value' => $request->input('value', 0),
            'min_order' => $request->input('minOrder') ?? $request->input('min_order', 0),
            'max_uses' => $request->input('maxUses') ?? $request->input('max_uses'),
            'date_start' => $request->input('dateStart') ?: ($request->input('date_start') ?: null),
            'date_end' => $request->input('dateEnd') ?: ($request->input('date_end') ?: null),
            'used_count' => 0,
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
            unset($data['used_count']); // Don't reset used_count on update
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

