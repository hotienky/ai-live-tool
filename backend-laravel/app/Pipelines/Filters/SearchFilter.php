<?php

namespace App\Pipelines\Filters;

use Closure;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filter: ?search=keyword
 *
 * Uses the model's $searchable property to determine which columns to search.
 * Default: ['name']
 */
class SearchFilter
{
    public function handle(Builder $query, Closure $next): Builder
    {
        $search = request('search');

        if ($search && trim($search) !== '') {
            $model = $query->getModel();
            $searchable = property_exists($model, 'searchable') ? $model->searchable : ['name'];

            $query->where(function ($q) use ($search, $searchable) {
                foreach ($searchable as $i => $col) {
                    $method = $i === 0 ? 'where' : 'orWhere';
                    $q->$method($col, 'ilike', "%{$search}%");
                }
            });
        }

        return $next($query);
    }
}
