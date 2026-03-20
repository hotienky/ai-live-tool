<?php

namespace App\Transformers;

class TenantTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug,
            'db_name' => $item->db_name,
            'owner_email' => $item->owner_email,
            'owner_name' => $item->owner_name,
            'status' => $item->status ?? 'active',
            'plan' => $item->plan ?? 'free',
            'custom_domain' => $item->custom_domain,
            'logo' => $item->logo,
            'features' => $item->features ?? 'all',
            'settings' => is_string($item->settings) ? json_decode($item->settings, true) : ($item->settings ?? []),
            'storage_driver' => $this->extractDataField($item, 'storage_driver', 'public'),
            'expires_at' => $item->expires_at,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }

    private function extractDataField($item, string $key, $default = null)
    {
        $data = $item->data ?? null;
        if (is_string($data)) {
            $data = json_decode($data, true);
        }
        return $data[$key] ?? $default;
    }
}
