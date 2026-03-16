<?php

namespace App\Services\Shipping;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Viettel Post Provider — resolves province/ward names to VTP internal IDs,
 * then calls VTP API for fee calculation.
 */
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
            $provinceName = $params['to_province_name'] ?? '';
            $wardName = $params['to_ward_name'] ?? '';

            // Resolve VTP ProvinceID from name
            $vtpProvinceId = $this->resolveProvinceId($provinceName);
            if (!$vtpProvinceId) {
                Log::info("[VTP] Could not resolve province: {$provinceName}");
                return [];
            }

            // Resolve VTP DistrictID (find district containing ward)
            $vtpDistrictId = $this->resolveDistrictId($vtpProvinceId, $wardName);
            if (!$vtpDistrictId) {
                Log::info("[VTP] Could not resolve district for province {$vtpProvinceId}, ward: {$wardName}");
                // Fallback: use province-level pricing with district = 0
                $vtpDistrictId = 0;
            }

            $response = Http::withHeaders([
                'Token' => $this->token,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/order/getPriceAll", [
                'SENDER_PROVINCE' => $this->senderProvince,
                'SENDER_DISTRICT' => $this->senderDistrict,
                'RECEIVER_PROVINCE' => $vtpProvinceId,
                'RECEIVER_DISTRICT' => $vtpDistrictId,
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

            return array_slice($results, 0, 3);
        } catch (\Exception $e) {
            Log::warning('[VTP] calculateFee error: ' . $e->getMessage());
            return [];
        }
    }

    // ─── Name → ID resolution ────────────────────────────────────

    private function resolveProvinceId(string $name): ?int
    {
        if (!$name) return null;

        $provinces = Cache::remember('vtp_provinces_raw', 86400, function () {
            $response = Http::withHeaders(['Token' => $this->token])
                ->get("{$this->baseUrl}/categories/listProvinceById", ['provinceId' => -1]);
            return $response->successful() ? ($response->json('data') ?? []) : [];
        });

        $needle = $this->normalizeVn($name);
        $best = null;
        $bestScore = 0;

        foreach ($provinces as $p) {
            $pName = $this->normalizeVn($p['PROVINCE_NAME'] ?? $p['provinceName'] ?? '');
            $score = similar_text($needle, $pName);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = (int) ($p['PROVINCE_ID'] ?? $p['provinceId'] ?? 0);
            }
        }

        return $best ?: null;
    }

    private function resolveDistrictId(int $provinceId, string $wardName): ?int
    {
        $districts = Cache::remember("vtp_districts_raw_{$provinceId}", 86400, function () use ($provinceId) {
            $response = Http::withHeaders(['Token' => $this->token])
                ->get("{$this->baseUrl}/categories/listDistrict", ['provinceId' => $provinceId]);
            return $response->successful() ? ($response->json('data') ?? []) : [];
        });

        if (empty($districts)) return null;

        // If no ward name, return first district
        if (!$wardName) {
            return (int) ($districts[0]['DISTRICT_ID'] ?? $districts[0]['districtId'] ?? 0) ?: null;
        }

        // Try to find district containing this ward by searching wards in each district
        $needle = $this->normalizeVn($wardName);
        foreach ($districts as $d) {
            $dId = (int) ($d['DISTRICT_ID'] ?? $d['districtId'] ?? 0);
            if (!$dId) continue;

            $wards = Cache::remember("vtp_wards_raw_{$dId}", 86400, function () use ($dId) {
                $response = Http::withHeaders(['Token' => $this->token])
                    ->get("{$this->baseUrl}/categories/listWards", ['districtId' => $dId]);
                return $response->successful() ? ($response->json('data') ?? []) : [];
            });

            foreach ($wards as $w) {
                $wName = $this->normalizeVn($w['WARDS_NAME'] ?? $w['wardsName'] ?? '');
                if (str_contains($wName, $needle) || str_contains($needle, $wName) || similar_text($needle, $wName) > strlen($needle) * 0.6) {
                    return $dId;
                }
            }
        }

        // Fallback: first district
        return (int) ($districts[0]['DISTRICT_ID'] ?? $districts[0]['districtId'] ?? 0) ?: null;
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private function estimateDays(string $serviceCode): string
    {
        return match (true) {
            str_contains($serviceCode, 'VHT') => '1 ngày',
            str_contains($serviceCode, 'VCN'), str_contains($serviceCode, 'NCOD') => '1-2 ngày',
            str_contains($serviceCode, 'VTK'), str_contains($serviceCode, 'SCOD') => '3-5 ngày',
            default => '2-4 ngày',
        };
    }

    private function normalizeVn(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = preg_replace('/^(thanh pho|tinh|thi xa|quan|huyen|phuong|xa|thi tran)\s+/u', '', Str::ascii($s));
        return trim($s);
    }
}
