<?php

namespace App\Transformers;

class LeadTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'customer_id' => $item->customer_id,
            'chat_log_id' => $item->chat_log_id,
            'unique_id' => $item->unique_id,
            'nickname' => $item->nickname,
            'comment' => $item->comment,
            'label' => $item->label,
            'status' => $item->status ?? 'new',
            'product_intent' => $item->product_intent,
            'notes' => $item->notes,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
