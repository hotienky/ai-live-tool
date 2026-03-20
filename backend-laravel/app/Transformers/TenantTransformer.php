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
            'storage_driver' => $this->extractDataField($item, 'storage_driver', 'local'),
            'storage_config' => $this->maskStorageConfig($this->extractDataField($item, 'storage_config', [])),
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

    /**
     * Mask secret fields in storage config — show only last 4 chars.
     */
    private function maskStorageConfig($config): array
    {
        if (!is_array($config)) return [];

        $sensitiveKeys = ['key', 'secret'];
        $masked = $config;
        foreach ($sensitiveKeys as $k) {
            if (!empty($masked[$k])) {
                $val = $masked[$k];
                $masked[$k] = str_repeat('*', max(0, strlen($val) - 4)) . substr($val, -4);
            }
        }
        return $masked;
    }
}
