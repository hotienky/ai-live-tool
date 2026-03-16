<?php
namespace App\QueryBuilder\Product;

use App\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;

class PriceMax extends Filter
{
    protected function applyFilters(EloquentBuilder|QueryBuilder $builder, Collection $context): EloquentBuilder|QueryBuilder
    {
        $value = $this->value($context);
        if (!is_numeric($value)) return $builder;

        return $builder->where('price', '<=', (float) $value);
    }
}
