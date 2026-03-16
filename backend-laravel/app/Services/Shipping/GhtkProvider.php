<?php

namespace App\Services\Shipping;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GhtkProvider implements ShippingProviderInterface
{
    private string $token;
    private string $pickProvince;
    private string $pickDistrict;
    private string $baseUrl;

    public function __construct(array $config)
    {
        $this->token = $config['token'] ?? '';
        $this->pickProvince = $config['pick_province'] ?? '';
        $this->pickDistrict = $config['pick_district'] ?? '';
        $this->baseUrl = $config['sandbox'] ?? false
            ? 'https://services.ghtklab.com'
            : 'https://services.giaohangtietkiem.vn';
    }

    public function getCode(): string { return 'ghtk'; }
    public function getName(): string { return 'Giao Hàng Tiết Kiệm'; }
    public function getLogo(): string { return '/images/shipping/ghtk.png'; }

    public function calculateFee(array $params): array
    {
        try {
            $results = [];

            // GHTK supports 2 transport modes: road and fly
            foreach (['road', 'fly'] as $transport) {
                $response = Http::withHeaders([
                    'Token' => $this->token,
                ])->get("{$this->baseUrl}/services/shipment/fee", [
                    'pick_province' => $this->pickProvince,
                    'pick_district' => $this->pickDistrict,
                    'province' => $params['to_province_name'] ?? '',
                    'district' => $params['to_district_name'] ?? '',
                    'ward' => $params['to_ward_name'] ?? '',
                    'weight' => (int) ($params['weight'] ?? 500),
                    'value' => (int) ($params['value'] ?? 0),
                    'transport' => $transport,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $fee = $data['fee']['fee'] ?? null;
                    if ($fee !== null) {
                        $results[] = [
                            'provider' => $this->getCode(),
                            'provider_name' => $this->getName(),
                            'logo' => $this->getLogo(),
                            'service_code' => $transport,
                            'service_name' => $transport === 'fly' ? 'Giao nhanh (bay)' : 'Giao tiêu chuẩn (bộ)',
                            'fee' => (int) $fee,
                            'estimated_days' => $transport === 'fly' ? '1-2 ngày' : '3-5 ngày',
                        ];
                    }
                }
            }
            return $results;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[GHTK] calculateFee error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * GHTK uses province/district names, not IDs.
     * We return GHN's province list as the address selector source.
     */
    public function getProvinces(): array { return []; }
    public function getDistricts($provinceId): array { return []; }
    public function getWards($districtId): array { return []; }
}
