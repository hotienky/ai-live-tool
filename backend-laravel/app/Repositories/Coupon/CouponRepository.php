<?php
namespace App\Repositories\Coupon;

use App\Models\Coupon;
use App\Repositories\BaseEloquentRepository;

class CouponRepository extends BaseEloquentRepository implements CouponRepositoryInterface
{
    public function __construct(Coupon $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code)
    {
        return $this->model->where('code', $code)->first();
    }

    public function validateCoupon(string $code, float $orderTotal)
    {
        $coupon = $this->findByCode($code);

        if (!$coupon) {
            return ['valid' => false, 'message' => 'Mã giảm giá không tồn tại'];
        }

        // Check expiry — support both expires_at and date_end columns
        $expiresAt = $coupon->expires_at ?? $coupon->date_end ?? null;
        if ($expiresAt && $expiresAt < now()) {
            return ['valid' => false, 'message' => 'Mã giảm giá đã hết hạn'];
        }

        // Check min order — support both min_order_amount and min_order columns
        $minOrder = $coupon->min_order_amount ?? $coupon->min_order ?? 0;
        if ($minOrder > 0 && $orderTotal < $minOrder) {
            return ['valid' => false, 'message' => "Đơn hàng tối thiểu " . number_format($minOrder) . "đ"];
        }

        // Check usage limit — support both usage_limit and max_uses columns
        $maxUses = $coupon->usage_limit ?? $coupon->max_uses ?? null;
        $usedCount = $coupon->times_used ?? $coupon->used_count ?? 0;
        if ($maxUses && $usedCount >= $maxUses) {
            return ['valid' => false, 'message' => 'Mã giảm giá đã hết lượt sử dụng'];
        }

        // Calculate discount — support both 'percentage' and 'percent' type
        $isPercent = in_array($coupon->type, ['percentage', 'percent']);
        $discount = $isPercent
            ? $orderTotal * ($coupon->value / 100)
            : $coupon->value;

        return ['valid' => true, 'discount' => round($discount), 'coupon' => $coupon];
    }
}
