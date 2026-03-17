<?php

namespace App\Pipelines;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pipeline\Pipeline as BasePipeline;

class QueryPipeline
{
    /**
     * Apply a chain of filters to an Eloquent query builder.
     *
     * Usage:
     *   $pipeline = new QueryPipeline();
     *   $query = $pipeline->process($query, [SearchFilter::class, SortFilter::class]);
     */
    public function process(Builder $query, array $filters): Builder
    {
        return app(BasePipeline::class)
            ->send($query)
            ->through($filters)
            ->thenReturn();
    }
}
