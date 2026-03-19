<?php
namespace App\Actions\Coupon;

use App\Repositories\Coupon\CouponRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\HasContentTranslations;

abstract class BaseAction
{
    use ApiResponse, HasContentTranslations;

    public function __construct(protected CouponRepositoryInterface $repo) {}

    protected function mapCouponFields(\Illuminate\Http\Request $request): array
    {
        $type = $request->input('type', 'percent');
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
}
