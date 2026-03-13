<?php

namespace App\Transformers;

class CustomerTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'phone' => $item->phone,
            'email' => $item->email ?? null,
            'address' => $item->address ?? null,
            'notes' => $item->notes ?? null,
            'total_orders' => (int) ($item->total_orders ?? 0),
            'total_spent' => (float) ($item->total_spent ?? 0),
            'tags' => $item->tags ?? null,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
