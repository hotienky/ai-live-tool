<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\Shipping\ShippingManager;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ShippingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private \App\Repositories\SystemConfig\SystemConfigRepositoryInterface $configRepo,
    ) {}

    private function manager(): ShippingManager
    {
        $configs = $this->configRepo->getByGroup('shipping');
        $configArray = $configs->map(fn($c) => ['key' => $c->key, 'value' => $c->value])->toArray();
        return new ShippingManager($configArray);
    }

    /**
     * POST /shipping/calculate
     */
    public function calculate(Request $request)
    {
        $manager = $this->manager();

        if (!$manager->hasProviders()) {
            return $this->successResponse([
                'options' => [],
                'message' => 'Chưa cấu hình đơn vị vận chuyển',
            ]);
        }

        $params = [
            'to_province' => $request->input('to_province_code', 0),
            'to_province_name' => $request->input('to_province_name', ''),
            'to_ward' => $request->input('to_ward_code', ''),
            'to_ward_name' => $request->input('to_ward_name', ''),
            'weight' => $request->input('weight', 500),
            'value' => $request->input('order_value', 0),
            'length' => $request->input('length', 20),
            'width' => $request->input('width', 15),
            'height' => $request->input('height', 10),
        ];

        $options = $manager->calculateAll($params);

        return $this->successResponse([
            'options' => $options,
        ]);
    }

    /**
     * GET /shipping/providers
     */
    public function providers()
    {
        return $this->successResponse($this->manager()->getEnabledProviders());
    }

    /**
     * GET /shipping/provinces
     * Danh sách tỉnh/thành phố từ JSON tĩnh (VietMap)
     */
    public function provinces()
    {
        $data = Cache::remember('vn_provinces', 86400, function () {
            $path = database_path('data/province.json');
            if (!file_exists($path)) return [];
            $raw = json_decode(file_get_contents($path), true);
            $result = [];
            foreach ($raw as $code => $p) {
                $result[] = [
                    'code' => $p['code'] ?? $code,
                    'name' => $p['name_with_type'] ?? $p['name'],
                    'slug' => $p['slug'] ?? '',
                    'type' => $p['type'] ?? '',
                ];
            }
            // Sort by name
            usort($result, fn($a, $b) => strcmp($a['name'], $b['name']));
            return $result;
        });

        return $this->successResponse($data);
    }

    /**
     * GET /shipping/wards/{provinceCode}
     * Danh sách phường/xã thuộc tỉnh (parent_code = provinceCode)
     */
    public function wards($provinceCode)
    {
        $cacheKey = "vn_wards_{$provinceCode}";
        $data = Cache::remember($cacheKey, 86400, function () use ($provinceCode) {
            $path = database_path('data/ward.json');
            if (!file_exists($path)) return [];
            $raw = json_decode(file_get_contents($path), true);
            $result = [];
            foreach ($raw as $code => $w) {
                if (($w['parent_code'] ?? '') == $provinceCode) {
                    $result[] = [
                        'code' => $w['code'] ?? $code,
                        'name' => $w['name_with_type'] ?? $w['name'],
                        'slug' => $w['slug'] ?? '',
                        'type' => $w['type'] ?? '',
                        'path' => $w['path'] ?? '',
                    ];
                }
            }
            usort($result, fn($a, $b) => strcmp($a['name'], $b['name']));
            return $result;
        });

        return $this->successResponse($data);
    }

    /**
     * GET /shipping/vietmap-autocomplete?text=...
     * Proxy VietMap Autocomplete v4 — giữ API key ở server, trả kết quả cho storefront
     */
    public function vietmapAutocomplete(Request $request)
    {
        $text = $request->input('text', '');
        if (mb_strlen($text) < 2) {
            return $this->successResponse([]);
        }

        $shippingConfigs = $this->configRepo->getByGroup('shipping');
        $apiKey = $shippingConfigs->firstWhere('key', 'shipping_vietmap_api_key')?->value;
        if (!$apiKey) {
            return $this->successResponse([]);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::get('https://maps.vietmap.vn/api/autocomplete/v4', [
                'apikey' => $apiKey,
                'text' => $text,
            ]);

            if (!$response->successful()) {
                return $this->successResponse([]);
            }

            $items = $response->json() ?? [];
            if (!is_array($items)) {
                $items = [];
            }

            $results = [];
            foreach (array_slice($items, 0, 8) as $item) {
                $boundaries = $item['boundaries'] ?? [];
                $province = null;
                $ward = null;

                foreach ($boundaries as $b) {
                    $type = $b['type'] ?? '';
                    if (in_array($type, ['province', 'city'])) {
                        $province = ['id' => $b['id'] ?? '', 'name' => $b['name'] ?? ''];
                    }
                    if (in_array($type, ['ward', 'commune'])) {
                        $ward = ['id' => $b['id'] ?? '', 'name' => $b['name'] ?? ''];
                    }
                }

                $results[] = [
                    'display' => $item['display'] ?? $item['name'] ?? '',
                    'address' => $item['address'] ?? '',
                    'name' => $item['name'] ?? '',
                    'lat' => $item['lat'] ?? null,
                    'lng' => $item['lng'] ?? null,
                    'province' => $province,
                    'ward' => $ward,
                ];
            }

            return $this->successResponse($results);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('[VietMap] Autocomplete error: ' . $e->getMessage());
            return $this->successResponse([]);
        }
    }
}
