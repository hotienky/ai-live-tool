<?php
namespace App\Pipelines;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

class ProductFilterPipeline extends AbstractFilterPipeline
{
    protected $pipes = [
        \App\QueryBuilder\Product\Search::class,
        \App\QueryBuilder\Product\CategoryId::class,
        \App\QueryBuilder\Product\BrandId::class,
        \App\QueryBuilder\Product\Featured::class,
        \App\QueryBuilder\Product\IsActive::class,
    ];

    public static function run(EloquentBuilder|QueryBuilder $builder, array $context): EloquentBuilder|QueryBuilder
    {
        return app(static::class)->with($context)->send($builder)->thenReturn();
    }
}
