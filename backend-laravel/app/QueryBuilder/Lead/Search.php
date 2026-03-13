<?php
namespace App\QueryBuilder\Lead;
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
            $q->where('name', 'ilike', "%{$value}%")->orWhere('phone', 'ilike', "%{$value}%")->orWhere('email', 'ilike', "%{$value}%");
        });
    }
}
