<?php

namespace App\Services\Shipping;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class ViettelPostProvider implements ShippingProviderInterface
{
    private string $token;
    private int $senderProvince;
    private int $senderDistrict;
    private string $baseUrl = 'https://partner.viettelpost.vn/v2';

    public function __construct(array $config)
    {
        $this->token = $config['token'] ?? '';
        $this->senderProvince = (int) ($config['sender_province'] ?? 0);
        $this->senderDistrict = (int) ($config['sender_district'] ?? 0);
    }

    public function getCode(): string { return 'vtp'; }
    public function getName(): string { return 'Viettel Post'; }
    public function getLogo(): string { return '/images/shipping/vtp.png'; }

    public function calculateFee(array $params): array
    {
        try {
            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/order/getPriceAll", [
                'SENDER_PROVINCE' => $this->senderProvince,
                'SENDER_DISTRICT' => $this->senderDistrict,
                'RECEIVER_PROVINCE' => (int) ($params['to_province'] ?? 0),
                'RECEIVER_DISTRICT' => (int) ($params['to_district'] ?? 0),
                'PRODUCT_TYPE' => 'HH',
                'PRODUCT_WEIGHT' => (int) ($params['weight'] ?? 500),
                'PRODUCT_PRICE' => (int) ($params['value'] ?? 0),
                'PRODUCT_LENGTH' => (int) ($params['length'] ?? 20),
                'PRODUCT_WIDTH' => (int) ($params['width'] ?? 15),
                'PRODUCT_HEIGHT' => (int) ($params['height'] ?? 10),
                'TYPE' => 1,
            ]);

            if (!$response->successful()) return [];

            $services = $response->json() ?? [];
            if (!is_array($services)) return [];

            $results = [];
            foreach ($services as $svc) {
                // Filter only common services
                $code = $svc['MA_DV_CHINH'] ?? '';
                $name = $svc['TEN_DICHVU'] ?? '';
                $fee = $svc['GIA_CUOC'] ?? 0;

                if ($fee > 0 && $name) {
                    $results[] = [
                        'provider' => $this->getCode(),
                        'provider_name' => $this->getName(),
                        'logo' => $this->getLogo(),
                        'service_code' => $code,
                        'service_name' => $name,
                        'fee' => (int) $fee,
                        'estimated_days' => $this->estimateDays($code),
                    ];
                }
            }

            // Limit to top 3 most relevant services
            return array_slice($results, 0, 3);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[VTP] calculateFee error: ' . $e->getMessage());
            return [];
        }
    }

    private function estimateDays(string $serviceCode): string
    {
        // VHT = Hỏa tốc, VCN = Chuyển nhanh, VTK = Tiết kiệm
        return match (true) {
            str_contains($serviceCode, 'VHT') => '1 ngày',
            str_contains($serviceCode, 'VCN'), str_contains($serviceCode, 'NCOD') => '1-2 ngày',
            str_contains($serviceCode, 'VTK'), str_contains($serviceCode, 'SCOD') => '3-5 ngày',
            default => '2-4 ngày',
        };
    }

    public function getProvinces(): array
    {
        return Cache::remember('vtp_provinces', 86400, function () {
            $response = Http::withHeaders(['Token' => $this->token])
                ->get("{$this->baseUrl}/categories/listProvinceById", ['provinceId' => -1]);

            if (!$response->successful()) return [];

            return collect($response->json('data') ?? [])
                ->map(fn($p) => [
                    'id' => $p['PROVINCE_ID'] ?? $p['provinceId'] ?? '',
                    'name' => $p['PROVINCE_NAME'] ?? $p['provinceName'] ?? '',
                ])
                ->sortBy('name')
                ->values()
                ->toArray();
        });
    }

    public function getDistricts($provinceId): array
    {
        return Cache::remember("vtp_districts_{$provinceId}", 86400, function () use ($provinceId) {
            $response = Http::withHeaders(['Token' => $this->token])
                ->get("{$this->baseUrl}/categories/listDistrict", ['provinceId' => (int) $provinceId]);

            if (!$response->successful()) return [];

            return collect($response->json('data') ?? [])
                ->map(fn($d) => [
                    'id' => $d['DISTRICT_ID'] ?? $d['districtId'] ?? '',
                    'name' => $d['DISTRICT_NAME'] ?? $d['districtName'] ?? '',
                ])
                ->sortBy('name')
                ->values()
                ->toArray();
        });
    }

    public function getWards($districtId): array
    {
        return Cache::remember("vtp_wards_{$districtId}", 86400, function () use ($districtId) {
            $response = Http::withHeaders(['Token' => $this->token])
                ->get("{$this->baseUrl}/categories/listWards", ['districtId' => (int) $districtId]);

            if (!$response->successful()) return [];

            return collect($response->json('data') ?? [])
                ->map(fn($w) => [
                    'id' => $w['WARDS_ID'] ?? $w['wardsId'] ?? '',
                    'name' => $w['WARDS_NAME'] ?? $w['wardsName'] ?? '',
                ])
                ->sortBy('name')
                ->values()
                ->toArray();
        });
    }
}
