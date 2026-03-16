<?php
namespace App\QueryBuilder\Order;

use App\QueryBuilder\Filter;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;

class DateRange extends Filter
{
    protected function applyFilters(EloquentBuilder|QueryBuilder $builder, Collection $context): EloquentBuilder|QueryBuilder
    {
        if ($context->has('date_from')) {
            $builder->where('created_at', '>=', $context->get('date_from'));
        }
        if ($context->has('date_to')) {
            $builder->where('created_at', '<=', $context->get('date_to') . ' 23:59:59');
        }
        return $builder;
    }
}
