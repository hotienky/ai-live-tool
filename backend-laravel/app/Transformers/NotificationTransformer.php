<?php

namespace App\Transformers;

class NotificationTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'user_id' => $item->user_id,
            'type' => $item->type,
            'title' => $item->title,
            'message' => $item->message,
            'data' => is_string($item->data) ? json_decode($item->data, true) : ($item->data ?? null),
            'is_read' => (bool) ($item->is_read ?? false),
            'read_at' => $item->read_at ?? null,
            'created_at' => $item->created_at,
        ];
    }
}
