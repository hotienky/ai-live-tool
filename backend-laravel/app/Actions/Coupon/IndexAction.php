<?php
namespace App\Actions\Coupon;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        $coupons = $this->repo->query()->orderByDesc('created_at')->get();
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
}
