<?php
namespace App\Pipelines;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

class LeadFilterPipeline extends AbstractFilterPipeline
{
    protected $pipes = [
        \App\QueryBuilder\Lead\Search::class,
        \App\QueryBuilder\Lead\Status::class,
        \App\QueryBuilder\Lead\Label::class,
    ];

    public static function run(EloquentBuilder|QueryBuilder $builder, array $context): EloquentBuilder|QueryBuilder
    {
        return app(static::class)->with($context)->send($builder)->thenReturn();
    }
}
