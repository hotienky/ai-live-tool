<?php

namespace App\Services\Shipping;

interface ShippingProviderInterface
{
    /** Provider identifier (ghn, ghtk, vtp) */
    public function getCode(): string;

    /** Human-readable name */
    public function getName(): string;

    /** Logo URL or icon identifier */
    public function getLogo(): string;

    /**
     * Calculate shipping fee
     *
     * @param array $params [
     *   'to_province'      => string,  // VietMap province code
     *   'to_province_name' => string,  // province name (e.g. "Tỉnh Đồng Nai")
     *   'to_ward'          => string,  // VietMap ward code
     *   'to_ward_name'     => string,  // ward name (e.g. "Xã Đak Lua")
     *   'weight'           => int,     // grams
     *   'value'            => float,   // order value for insurance
     *   'length'           => int,     // cm
     *   'width'            => int,     // cm
     *   'height'           => int,     // cm
     * ]
     * @return array [ ['provider'=>'', 'service_code'=>'', 'service_name'=>'', 'fee'=>0, 'estimated_days'=>''] ]
     */
    public function calculateFee(array $params): array;
}
