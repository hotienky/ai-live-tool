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
            return ['valid' => false, 'message' => 'Coupon not found'];
        }

        if (isset($coupon->expires_at) && $coupon->expires_at < now()) {
            return ['valid' => false, 'message' => 'Coupon has expired'];
        }

        if (isset($coupon->min_order_amount) && $orderTotal < $coupon->min_order_amount) {
            return ['valid' => false, 'message' => 'Order total does not meet minimum requirement'];
        }

        $discount = $coupon->type === 'percentage'
            ? $orderTotal * ($coupon->value / 100)
            : $coupon->value;

        return ['valid' => true, 'discount' => $discount, 'coupon' => $coupon];
    }
}
