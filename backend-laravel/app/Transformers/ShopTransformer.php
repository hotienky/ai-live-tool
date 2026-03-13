<?php

namespace App\Transformers;

class ShopTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'platform' => $item->platform,
            'shop_id' => $item->shop_id,
            'status' => $item->status ?? 'active',
            'settings' => is_string($item->settings) ? json_decode($item->settings, true) : ($item->settings ?? []),
            'has_token' => !empty($item->access_token),
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
