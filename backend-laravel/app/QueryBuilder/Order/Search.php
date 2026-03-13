<?php
namespace App\QueryBuilder\Order;

use App\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;

class Search extends Filter
{
    protected function applyFilters(EloquentBuilder|QueryBuilder $builder, Collection $context): EloquentBuilder|QueryBuilder
    {
        $value = $this->value($context);
        if (empty($value)) return $builder;

        return $builder->where(function ($q) use ($value) {
            $q->where('customer_name', 'ilike', "%{$value}%")
              ->orWhere('customer_phone', 'ilike', "%{$value}%")
              ->orWhere('id', is_numeric($value) ? $value : 0);
        });
    }
}
