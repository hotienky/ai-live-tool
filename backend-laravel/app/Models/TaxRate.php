<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    protected $table = 'tax_rates';

    protected $fillable = [
        'name', 'code', 'rate', 'type', 'scope',
        'applies_to', 'is_compound', 'priority', 'is_active',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'applies_to' => 'array',
        'is_compound' => 'boolean',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    /* Scopes */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeGlobal($query)
    {
        return $query->where('scope', 'global');
    }

    public function scopeByScope($query, string $scope)
    {
        return $query->where('scope', $scope);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority')->orderBy('id');
    }

    /**
     * Check if this tax rate applies to a given product/category/region
     */
    public function appliesTo(?int $categoryId = null, ?int $productId = null, ?int $provinceId = null): bool
    {
        if ($this->scope === 'global') return true;

        $ids = $this->applies_to ?? [];
        if (empty($ids)) return true; // empty applies_to = applies to all

        return match ($this->scope) {
            'category' => $categoryId && in_array($categoryId, $ids),
            'product'  => $productId && in_array($productId, $ids),
            'region'   => $provinceId && in_array($provinceId, $ids),
            default    => false,
        };
    }
}
