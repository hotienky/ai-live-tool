<?php
namespace App\Repositories\Coupon;

use App\Repositories\BaseRepoInterface;

interface CouponRepositoryInterface extends BaseRepoInterface
{
    public function findByCode(string $code);
    public function validateCoupon(string $code, float $orderTotal);
}
