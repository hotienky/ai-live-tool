<?php

namespace App\Transformers;

class OrderTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'customer_name' => $item->customer_name,
            'customer_phone' => $item->customer_phone,
            'customer_address' => $item->customer_address,
            'customer_email' => $item->customer_email ?? null,
            'payment_method' => $item->payment_method,
            'status' => $item->status,
            'notes' => $item->notes,
            'items' => is_string($item->items) ? json_decode($item->items, true) : $item->items,
            'total_amount' => (float) $item->total_amount,
            'confirmed_at' => $item->confirmed_at ?? null,
            'shipped_at' => $item->shipped_at ?? null,
            'delivered_at' => $item->delivered_at ?? null,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
