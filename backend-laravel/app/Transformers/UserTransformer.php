<?php

namespace App\Transformers;

class UserTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'full_name' => $item->full_name ?? $item->name,
            'email' => $item->email,
            'role' => $item->role ?? 'admin',
            'role_id' => $item->role_id ?? null,
            'is_active' => (bool) ($item->is_active ?? true),
            'last_login_at' => $item->last_login_at ?? null,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
