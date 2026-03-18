<?php

namespace App\Services;

use App\Repositories\Tax\TaxRateRepositoryInterface;
use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;

class TaxService
{
    public function __construct(
        private TaxRateRepositoryInterface $taxRateRepo,
        private SystemConfigRepositoryInterface $configRepo,
    ) {}

    /**
     * Check if tax is enabled for this tenant
     */
    public function isEnabled(): bool
    {
        return $this->getConfig('enabled', 'false') === 'true';
    }

    /**
     * Get a tax config value
     */
    public function getConfig(string $key, $default = null)
    {
        $configs = $this->configRepo->getByGroup('tax');
        foreach ($configs as $c) {
            if ($c->key === $key) return $c->value;
        }
        return $default;
    }

    /**
     * Get all tax config as array
     */
    public function getAllConfig(): array
    {
        $configs = $this->configRepo->getByGroup('tax');
        $result = [
            'enabled' => 'false',
            'price_includes_tax' => 'false',
            'default_rate_id' => null,
            'display_mode' => 'exclusive',   // inclusive | exclusive | both
            'label' => 'VAT',
            'rounding' => 'round',           // round | ceil | floor
        ];
        foreach ($configs as $c) {
            $result[$c->key] = $c->value;
        }
        return $result;
    }

    /**
     * Calculate tax for a single line item
     *
     * @param float $price      Unit price (before or after tax depending on config)
     * @param int   $qty        Quantity
     * @param int|null $categoryId
     * @param int|null $productId
     * @param int|null $provinceId
     * @return array{amount: float, details: array}
     */
    public function calculateItemTax(
        float $price,
        int $qty = 1,
        ?int $categoryId = null,
        ?int $productId = null,
        ?int $provinceId = null,
    ): array {
        if (!$this->isEnabled()) {
            return ['amount' => 0, 'details' => []];
        }

        $rates = $this->taxRateRepo->getApplicableRates($categoryId, $productId, $provinceId);
        if (empty($rates)) return ['amount' => 0, 'details' => []];

        $lineTotal = $price * $qty;
        $priceIncludesTax = $this->getConfig('price_includes_tax', 'false') === 'true';
        $rounding = $this->getConfig('rounding', 'round');

        $taxAmount = 0;
        $details = [];
        $baseForCompound = $lineTotal;

        foreach ($rates as $rate) {
            if ($rate->type === 'percentage') {
                if ($priceIncludesTax) {
                    // Extract tax from inclusive price: tax = price - (price / (1 + rate/100))
                    $base = $rate->is_compound ? $baseForCompound : $lineTotal;
                    $rateDecimal = $rate->rate / 100;
                    $itemTax = $base - ($base / (1 + $rateDecimal));
                } else {
                    // Add tax to exclusive price
                    $base = $rate->is_compound ? ($lineTotal + $taxAmount) : $lineTotal;
                    $itemTax = $base * ($rate->rate / 100);
                }
            } else {
                // Fixed amount per unit
                $itemTax = $rate->rate * $qty;
            }

            $itemTax = $this->applyRounding($itemTax, $rounding);

            $taxAmount += $itemTax;
            $details[] = [
                'name' => $rate->name,
                'code' => $rate->code,
                'rate' => $rate->rate,
                'type' => $rate->type,
                'amount' => $itemTax,
            ];

            if ($rate->is_compound) {
                $baseForCompound = $lineTotal + $taxAmount;
            }
        }

        return [
            'amount' => $this->applyRounding($taxAmount, $rounding),
            'details' => $details,
        ];
    }

    /**
     * Calculate tax for entire cart
     *
     * @param array $items  Each item: {price, qty, category_id?, product_id?}
     * @param int|null $provinceId
     * @return array{total: float, details: array, per_item: array}
     */
    public function calculateCartTax(array $items, ?int $provinceId = null): array
    {
        if (!$this->isEnabled()) {
            return ['total' => 0, 'details' => [], 'per_item' => []];
        }

        $totalTax = 0;
        $aggregatedDetails = [];
        $perItem = [];

        foreach ($items as $index => $item) {
            $price = floatval($item['price'] ?? 0);
            $qty = intval($item['qty'] ?? 1);
            $categoryId = intval($item['category_id'] ?? 0) ?: null;
            $productId = intval($item['product_id'] ?? $item['id'] ?? 0) ?: null;

            $result = $this->calculateItemTax($price, $qty, $categoryId, $productId, $provinceId);
            $totalTax += $result['amount'];
            $perItem[$index] = $result;

            // Aggregate details by tax code
            foreach ($result['details'] as $detail) {
                $code = $detail['code'];
                if (isset($aggregatedDetails[$code])) {
                    $aggregatedDetails[$code]['amount'] += $detail['amount'];
                } else {
                    $aggregatedDetails[$code] = $detail;
                }
            }
        }

        return [
            'total' => $totalTax,
            'details' => array_values($aggregatedDetails),
            'per_item' => $perItem,
        ];
    }

    /**
     * Preview tax for storefront (before checkout)
     */
    public function previewTax(array $items, ?int $provinceId = null): array
    {
        $result = $this->calculateCartTax($items, $provinceId);
        $config = $this->getAllConfig();

        return [
            'enabled' => $config['enabled'] === 'true',
            'label' => $config['label'] ?? 'VAT',
            'display_mode' => $config['display_mode'] ?? 'exclusive',
            'price_includes_tax' => $config['price_includes_tax'] === 'true',
            'tax_amount' => $result['total'],
            'tax_details' => $result['details'],
        ];
    }

    private function applyRounding(float $amount, string $method): float
    {
        return match ($method) {
            'ceil' => ceil($amount * 100) / 100,
            'floor' => floor($amount * 100) / 100,
            default => round($amount, 2),
        };
    }
}
