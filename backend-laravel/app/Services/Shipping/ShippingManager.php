<?php

namespace App\Services\Shipping;

use Illuminate\Support\Facades\Cache;

/**
 * Factory — resolves enabled ShippingProviders from tenant system_configs,
 * aggregates fee calculations across all active providers.
 */
class ShippingManager
{
    private array $providers = [];
    private ?ShippingProviderInterface $addressProvider = null;

    public function __construct(array $configs)
    {
        $map = [];
        foreach ($configs as $c) {
            $map[$c->key ?? $c['key'] ?? ''] = $c->value ?? $c['value'] ?? '';
        }

        // GHN
        if (($map['shipping_ghn_enabled'] ?? '') === '1' && !empty($map['shipping_ghn_token'])) {
            $provider = new GhnProvider([
                'token' => $map['shipping_ghn_token'],
                'shop_id' => $map['shipping_ghn_shop_id'] ?? '',
                'from_district' => $map['shipping_ghn_from_district'] ?? 0,
                'from_ward' => $map['shipping_ghn_from_ward'] ?? '',
                'sandbox' => ($map['shipping_ghn_sandbox'] ?? '0') === '1',
            ]);
            $this->providers[] = $provider;
            // GHN has the best address data (provinces/districts/wards)
            $this->addressProvider = $provider;
        }

        // GHTK
        if (($map['shipping_ghtk_enabled'] ?? '') === '1' && !empty($map['shipping_ghtk_token'])) {
            $this->providers[] = new GhtkProvider([
                'token' => $map['shipping_ghtk_token'],
                'pick_province' => $map['shipping_ghtk_pick_province'] ?? '',
                'pick_district' => $map['shipping_ghtk_pick_district'] ?? '',
                'sandbox' => ($map['shipping_ghtk_sandbox'] ?? '0') === '1',
            ]);
        }

        // Viettel Post
        if (($map['shipping_vtp_enabled'] ?? '') === '1' && !empty($map['shipping_vtp_token'])) {
            $provider = new ViettelPostProvider([
                'token' => $map['shipping_vtp_token'],
                'sender_province' => $map['shipping_vtp_sender_province'] ?? 0,
                'sender_district' => $map['shipping_vtp_sender_district'] ?? 0,
            ]);
            $this->providers[] = $provider;
            if (!$this->addressProvider) {
                $this->addressProvider = $provider;
            }
        }
    }

    /**
     * Get all enabled provider codes
     */
    public function getEnabledProviders(): array
    {
        return array_map(fn($p) => [
            'code' => $p->getCode(),
            'name' => $p->getName(),
            'logo' => $p->getLogo(),
        ], $this->providers);
    }

    /**
     * Calculate shipping from ALL active providers
     */
    public function calculateAll(array $params): array
    {
        $results = [];
        foreach ($this->providers as $provider) {
            $fees = $provider->calculateFee($params);
            $results = array_merge($results, $fees);
        }
        // Sort by fee ascending
        usort($results, fn($a, $b) => $a['fee'] <=> $b['fee']);
        return $results;
    }

    /**
     * Get provinces from the best available address provider (GHN preferred)
     */
    public function getProvinces(): array
    {
        return $this->addressProvider?->getProvinces() ?? [];
    }

    public function getDistricts($provinceId): array
    {
        return $this->addressProvider?->getDistricts($provinceId) ?? [];
    }

    public function getWards($districtId): array
    {
        return $this->addressProvider?->getWards($districtId) ?? [];
    }

    public function hasProviders(): bool
    {
        return count($this->providers) > 0;
    }
}
