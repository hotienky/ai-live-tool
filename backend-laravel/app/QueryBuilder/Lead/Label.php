<?php
namespace App\QueryBuilder\Lead;
use App\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;

class Label extends Filter
{
    protected function applyFilters(EloquentBuilder|QueryBuilder $builder, Collection $context): EloquentBuilder|QueryBuilder
    {
        return $builder->where('label', $this->value($context));
    }
}
