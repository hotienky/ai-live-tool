<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\Shipping\ShippingManager;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    use ApiResponse;

    private function manager(): ShippingManager
    {
        $configs = \App\Models\SystemConfig::where('key', 'like', 'shipping_%')->get()->toArray();
        return new ShippingManager($configs);
    }

    /**
     * POST /shipping/calculate
     * Calculate shipping fee from all active providers
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
            'to_province' => $request->input('to_province_id', 0),
            'to_province_name' => $request->input('to_province_name', ''),
            'to_district' => $request->input('to_district_id', 0),
            'to_district_name' => $request->input('to_district_name', ''),
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
     * List active shipping providers (for CMS display)
     */
    public function providers()
    {
        return $this->successResponse($this->manager()->getEnabledProviders());
    }

    /**
     * GET /shipping/provinces
     */
    public function provinces()
    {
        $provinces = $this->manager()->getProvinces();
        return $this->successResponse($provinces);
    }

    /**
     * GET /shipping/districts/{provinceId}
     */
    public function districts($provinceId)
    {
        $districts = $this->manager()->getDistricts($provinceId);
        return $this->successResponse($districts);
    }

    /**
     * GET /shipping/wards/{districtId}
     */
    public function wards($districtId)
    {
        $wards = $this->manager()->getWards($districtId);
        return $this->successResponse($wards);
    }
}
