<?php

namespace App\Pipelines\Filters;

use Closure;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filter: ?sort_by=name&sort_dir=asc
 *
 * Uses the model's $sortable property for allowed columns.
 * Default sort: created_at desc
 */
class SortFilter
{
    public function handle(Builder $query, Closure $next): Builder
    {
        $sortBy = request('sort_by');
        $sortDir = strtolower(request('sort_dir', 'desc'));

        if ($sortDir !== 'asc') $sortDir = 'desc';

        if ($sortBy) {
            $model = $query->getModel();
            $sortable = property_exists($model, 'sortable')
                ? $model->sortable
                : ['id', 'name', 'created_at', 'updated_at'];

            if (in_array($sortBy, $sortable)) {
                $query->orderBy($sortBy, $sortDir);
                return $next($query);
            }
        }

        // Default sort
        $query->orderBy('created_at', 'desc');

        return $next($query);
    }
}
