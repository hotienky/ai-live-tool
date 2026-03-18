<?php

namespace App\Repositories\Tax;

use App\Models\TaxRate;
use App\Repositories\BaseEloquentRepository;

class TaxRateRepository extends BaseEloquentRepository implements TaxRateRepositoryInterface
{
    public function __construct(TaxRate $model)
    {
        parent::__construct($model);
    }

    public function getActive()
    {
        return $this->model->active()->ordered()->get();
    }

    public function getApplicableRates(?int $categoryId = null, ?int $productId = null, ?int $provinceId = null): array
    {
        $rates = $this->getActive();
        return $rates->filter(function ($rate) use ($categoryId, $productId, $provinceId) {
            return $rate->appliesTo($categoryId, $productId, $provinceId);
        })->values()->all();
    }
}
