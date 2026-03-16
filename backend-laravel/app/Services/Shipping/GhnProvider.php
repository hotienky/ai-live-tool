<?php

namespace App\Services\Shipping;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * GHN Provider — resolves province/ward names to GHN internal IDs,
 * then calls GHN API for fee calculation.
 */
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
            $provinceName = $params['to_province_name'] ?? '';
            $wardName = $params['to_ward_name'] ?? '';

            // Resolve GHN province → district (best match)
            $ghnProvinceId = $this->resolveProvinceId($provinceName);
            if (!$ghnProvinceId) {
                Log::info("[GHN] Could not resolve province: {$provinceName}");
                return [];
            }

            // Get first district of resolved province (fallback since VN no longer has districts)
            $ghnDistrictId = $this->resolveDistrictId($ghnProvinceId, $wardName);
            if (!$ghnDistrictId) {
                Log::info("[GHN] Could not resolve district for province {$ghnProvinceId}");
                return [];
            }

            // Try to resolve ward code within district
            $ghnWardCode = $this->resolveWardCode($ghnDistrictId, $wardName);

            // Get available services
            $services = $this->getAvailableServices($ghnDistrictId);

            $results = [];
            foreach ($services as $svc) {
                $payload = [
                    'from_district_id' => $this->fromDistrictId,
                    'from_ward_code' => $this->fromWardCode,
                    'to_district_id' => $ghnDistrictId,
                    'to_ward_code' => $ghnWardCode ?: '',
                    'weight' => (int) ($params['weight'] ?? 500),
                    'length' => (int) ($params['length'] ?? 20),
                    'width' => (int) ($params['width'] ?? 15),
                    'height' => (int) ($params['height'] ?? 10),
                    'insurance_value' => (int) ($params['value'] ?? 0),
                    'service_type_id' => $svc['service_type_id'],
                ];

                $response = Http::withHeaders([
                    'Token' => $this->token,
                    'ShopId' => $this->shopId,
                ])->post("{$this->baseUrl}/v2/shipping-order/fee", $payload);

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
            Log::warning('[GHN] calculateFee error: ' . $e->getMessage());
            return [];
        }
    }

    // ─── Name → ID resolution ────────────────────────────────────

    /**
     * Find GHN ProvinceID by name similarity
     */
    private function resolveProvinceId(string $name): ?int
    {
        if (!$name) return null;

        $provinces = Cache::remember('ghn_provinces_raw', 86400, function () {
            $response = Http::withHeaders(['Token' => $this->token])
                ->get("{$this->baseUrl}/master-data/province");
            return $response->successful() ? ($response->json('data') ?? []) : [];
        });

        $needle = $this->normalizeVn($name);
        $best = null;
        $bestScore = 0;

        foreach ($provinces as $p) {
            $pName = $this->normalizeVn($p['ProvinceName'] ?? '');
            $score = similar_text($needle, $pName);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $p['ProvinceID'] ?? null;
            }
        }

        return $best;
    }

    /**
     * Find GHN DistrictID by ward name within a province (best match)
     */
    private function resolveDistrictId(int $provinceId, string $wardName): ?int
    {
        $districts = Cache::remember("ghn_districts_raw_{$provinceId}", 86400, function () use ($provinceId) {
            $response = Http::withHeaders(['Token' => $this->token])
                ->post("{$this->baseUrl}/master-data/district", ['province_id' => $provinceId]);
            return $response->successful() ? ($response->json('data') ?? []) : [];
        });

        if (empty($districts)) return null;

        // If no ward name, return first district
        if (!$wardName) {
            return $districts[0]['DistrictID'] ?? null;
        }

        // Try to find the district containing the ward
        $needle = $this->normalizeVn($wardName);
        foreach ($districts as $d) {
            $districtId = $d['DistrictID'] ?? null;
            if (!$districtId) continue;

            $wards = $this->getWardsList($districtId);
            foreach ($wards as $w) {
                $wName = $this->normalizeVn($w['WardName'] ?? '');
                if (str_contains($wName, $needle) || str_contains($needle, $wName) || similar_text($needle, $wName) > strlen($needle) * 0.6) {
                    return $districtId;
                }
            }
        }

        // Fallback: first district
        return $districts[0]['DistrictID'] ?? null;
    }

    /**
     * Find GHN WardCode by name within district
     */
    private function resolveWardCode(int $districtId, string $wardName): ?string
    {
        if (!$wardName) return null;

        $wards = $this->getWardsList($districtId);
        $needle = $this->normalizeVn($wardName);
        $best = null;
        $bestScore = 0;

        foreach ($wards as $w) {
            $wName = $this->normalizeVn($w['WardName'] ?? '');
            $score = similar_text($needle, $wName);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $w['WardCode'] ?? null;
            }
        }

        return $best;
    }

    private function getWardsList(int $districtId): array
    {
        return Cache::remember("ghn_wards_raw_{$districtId}", 86400, function () use ($districtId) {
            $response = Http::withHeaders(['Token' => $this->token])
                ->post("{$this->baseUrl}/master-data/ward", ['district_id' => $districtId]);
            return $response->successful() ? ($response->json('data') ?? []) : [];
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private function getAvailableServices(int $toDistrictId): array
    {
        try {
            $response = Http::withHeaders(['Token' => $this->token])
                ->post("{$this->baseUrl}/v2/shipping-order/available-services", [
                    'shop_id' => (int) $this->shopId,
                    'from_district' => $this->fromDistrictId,
                    'to_district' => $toDistrictId,
                ]);
            return $response->successful() ? ($response->json('data') ?? []) : [];
        } catch (\Exception $e) {
            Log::warning('[GHN] getAvailableServices error: ' . $e->getMessage());
            return [];
        }
    }

    private function estimateDays(int $serviceTypeId): string
    {
        return match ($serviceTypeId) {
            2 => '2-3 ngày',
            5 => '3-5 ngày',
            default => '2-5 ngày',
        };
    }

    private function normalizeVn(string $s): string
    {
        $s = mb_strtolower(trim($s));
        // Remove common prefixes
        $s = preg_replace('/^(thanh pho|tinh|thi xa|quan|huyen|phuong|xa|thi tran)\s+/u', '', Str::ascii($s));
        return trim($s);
    }
}
