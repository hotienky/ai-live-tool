<?php
namespace App\QueryBuilder\Product;

use App\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;

class CategoryId extends Filter
{
    protected function applyFilters(EloquentBuilder|QueryBuilder $builder, Collection $context): EloquentBuilder|QueryBuilder
    {
        return $builder->where('category_id', $this->value($context));
    }
}
