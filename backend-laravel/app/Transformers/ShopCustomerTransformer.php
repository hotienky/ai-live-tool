<?php

namespace App\Transformers;

class ShopCustomerTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'email' => $item->email,
            'phone' => $item->phone ?? null,
            'avatar' => $item->avatar ?? null,
            'is_active' => (bool) ($item->is_active ?? true),
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
