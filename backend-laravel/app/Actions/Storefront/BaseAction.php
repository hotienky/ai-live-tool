<?php
namespace App\Actions\Storefront;

use App\Repositories\Order\OrderRepositoryInterface;
use App\Repositories\Product\ProductRepositoryInterface;
use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;
use App\Repositories\Coupon\CouponRepositoryInterface;
use App\Traits\ApiResponse;

abstract class BaseAction
{
    use ApiResponse;

    public function __construct(
        protected OrderRepositoryInterface $orderRepo,
        protected ProductRepositoryInterface $productRepo,
        protected SystemConfigRepositoryInterface $configRepo,
        protected CouponRepositoryInterface $couponRepo,
    ) {}

    protected function getBankInfo(int $orderId): array
    {
        $configs = $this->configRepo->getByGroup('payment');
        $map = [];
        foreach ($configs as $c) { $map[$c->key] = $c->value; }
        return [
            'account_name' => $map['payment_bank_account_name'] ?? '',
            'account_number' => $map['payment_bank_account_number'] ?? '',
            'bank_name' => $map['payment_bank_name_display'] ?? '',
            'bank_bin' => $map['payment_bank_bin'] ?? '',
            'branch' => $map['payment_bank_branch'] ?? '',
            'note' => str_replace('{order_id}', $orderId, $map['payment_bank_note_template'] ?? ''),
        ];
    }
}
