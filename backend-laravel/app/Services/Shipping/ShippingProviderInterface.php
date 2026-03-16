<?php

namespace App\Services\Shipping;

interface ShippingProviderInterface
{
    /**
     * Provider identifier (ghn, ghtk, vtp)
     */
    public function getCode(): string;

    /**
     * Human-readable name
     */
    public function getName(): string;

    /**
     * Logo URL or icon identifier
     */
    public function getLogo(): string;

    /**
     * Calculate shipping fee
     *
     * @param array $params [
     *   'to_province'   => string|int,  // province name or ID
     *   'to_district'   => string|int,  // district name or ID
     *   'to_ward'       => string|null, // ward name or code
     *   'weight'        => int,         // grams
     *   'value'         => float,       // order value for insurance
     *   'length'        => int|null,    // cm
     *   'width'         => int|null,    // cm
     *   'height'        => int|null,    // cm
     * ]
     * @return array [ ['service_code' => '', 'service_name' => '', 'fee' => 0, 'estimated_days' => ''] ]
     */
    public function calculateFee(array $params): array;

    /**
     * Get list of provinces/cities
     * @return array [ ['id' => '', 'name' => ''] ]
     */
    public function getProvinces(): array;

    /**
     * Get districts of a province
     * @return array [ ['id' => '', 'name' => ''] ]
     */
    public function getDistricts($provinceId): array;

    /**
     * Get wards of a district (if supported)
     * @return array [ ['id' => '', 'name' => ''] ]
     */
    public function getWards($districtId): array;
}
