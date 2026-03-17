<?php

namespace App\Pipelines\Filters;

use Closure;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filter: ?from=2024-01-01&to=2024-12-31
 *
 * Filters by created_at date range. Override column with ?date_column=updated_at.
 */
class DateRangeFilter
{
    public function handle(Builder $query, Closure $next): Builder
    {
        $column = request('date_column', 'created_at');
        $from = request('from');
        $to = request('to');

        if ($from) {
            $query->where($column, '>=', $from);
        }

        if ($to) {
            $query->where($column, '<=', $to . ' 23:59:59');
        }

        return $next($query);
    }
}
