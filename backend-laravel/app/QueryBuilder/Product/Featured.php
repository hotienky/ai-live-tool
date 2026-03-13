<?php
namespace App\QueryBuilder\Product;

use App\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;

class Featured extends Filter
{
    protected function applyFilters(EloquentBuilder|QueryBuilder $builder, Collection $context): EloquentBuilder|QueryBuilder
    {
        if ($this->value($context)) {
            return $builder->where('is_featured', true);
        }
        return $builder;
    }
}
