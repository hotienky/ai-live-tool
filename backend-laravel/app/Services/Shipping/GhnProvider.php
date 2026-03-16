<?php

namespace App\Services\Shipping;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GhnProvider implements ShippingProviderInterface
{
    private string $token;
    private string $shopId;
    private int $fromDistrictId;
    private string $fromWardCode;
    private string $baseUrl;

    public function __construct(array $config)
    {
        $this->token = $config['token'] ?? '';
        $this->shopId = $config['shop_id'] ?? '';
        $this->fromDistrictId = (int) ($config['from_district'] ?? 0);
        $this->fromWardCode = $config['from_ward'] ?? '';
        $this->baseUrl = $config['sandbox'] ?? false
            ? 'https://dev-online-gateway.ghn.vn/shiip/public-api'
            : 'https://online-gateway.ghn.vn/shiip/public-api';
    }

    public function getCode(): string { return 'ghn'; }
    public function getName(): string { return 'Giao Hàng Nhanh'; }
    public function getLogo(): string { return '/images/shipping/ghn.png'; }

    public function calculateFee(array $params): array
    {
        try {
            // First get available services
            $services = $this->getAvailableServices($params['to_district'] ?? 0);

            $results = [];
            foreach ($services as $svc) {
                $response = Http::withHeaders([
                    'Token' => $this->token,
                    'ShopId' => $this->shopId,
                ])->post("{$this->baseUrl}/v2/shipping-order/fee", [
                    'from_district_id' => $this->fromDistrictId,
                    'from_ward_code' => $this->fromWardCode,
                    'to_district_id' => (int) ($params['to_district'] ?? 0),
                    'to_ward_code' => $params['to_ward'] ?? '',
                    'weight' => (int) ($params['weight'] ?? 500),
                    'length' => (int) ($params['length'] ?? 20),
                    'width' => (int) ($params['width'] ?? 15),
                    'height' => (int) ($params['height'] ?? 10),
                    'insurance_value' => (int) ($params['value'] ?? 0),
                    'service_type_id' => $svc['service_type_id'],
                ]);

                if ($response->successful()) {
                    $data = $response->json('data');
                    if ($data && isset($data['total'])) {
                        $results[] = [
                            'provider' => $this->getCode(),
                            'provider_name' => $this->getName(),
                            'logo' => $this->getLogo(),
                            'service_code' => (string) $svc['service_type_id'],
                            'service_name' => $svc['short_name'] ?? 'Giao hàng',
                            'fee' => $data['total'],
                            'estimated_days' => $this->estimateDays($svc['service_type_id']),
                        ];
                    }
                }
            }
            return $results;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[GHN] calculateFee error: ' . $e->getMessage());
            return [];
        }
    }

    private function getAvailableServices(int $toDistrictId): array
    {
        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
            ])->post("{$this->baseUrl}/v2/shipping-order/available-services", [
                'shop_id' => (int) $this->shopId,
                'from_district' => $this->fromDistrictId,
                'to_district' => $toDistrictId,
            ]);

            if ($response->successful()) {
                return $response->json('data') ?? [];
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[GHN] getAvailableServices error: ' . $e->getMessage());
        }
        return [];
    }

    private function estimateDays(int $serviceTypeId): string
    {
        return match ($serviceTypeId) {
            2 => '2-3 ngày',
            5 => '3-5 ngày',
            default => '2-5 ngày',
        };
    }

    public function getProvinces(): array
    {
        return Cache::remember('ghn_provinces', 86400, function () {
            $response = Http::withHeaders(['Token' => $this->token])
                ->get("{$this->baseUrl}/master-data/province");

            if (!$response->successful()) return [];

            return collect($response->json('data') ?? [])
                ->map(fn($p) => [
                    'id' => $p['ProvinceID'],
                    'name' => $p['ProvinceName'],
                    'code' => $p['Code'] ?? '',
                ])
                ->sortBy('name')
                ->values()
                ->toArray();
        });
    }

    public function getDistricts($provinceId): array
    {
        return Cache::remember("ghn_districts_{$provinceId}", 86400, function () use ($provinceId) {
            $response = Http::withHeaders(['Token' => $this->token])
                ->post("{$this->baseUrl}/master-data/district", [
                    'province_id' => (int) $provinceId,
                ]);

            if (!$response->successful()) return [];

            return collect($response->json('data') ?? [])
                ->map(fn($d) => [
                    'id' => $d['DistrictID'],
                    'name' => $d['DistrictName'],
                ])
                ->sortBy('name')
                ->values()
                ->toArray();
        });
    }

    public function getWards($districtId): array
    {
        return Cache::remember("ghn_wards_{$districtId}", 86400, function () use ($districtId) {
            $response = Http::withHeaders(['Token' => $this->token])
                ->post("{$this->baseUrl}/master-data/ward", [
                    'district_id' => (int) $districtId,
                ]);

            if (!$response->successful()) return [];

            return collect($response->json('data') ?? [])
                ->map(fn($w) => [
                    'id' => $w['WardCode'],
                    'name' => $w['WardName'],
                ])
                ->sortBy('name')
                ->values()
                ->toArray();
        });
    }
}
