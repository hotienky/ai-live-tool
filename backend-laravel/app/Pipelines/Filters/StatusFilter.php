<?php

namespace App\Pipelines\Filters;

use Closure;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filter: ?status=active | ?is_active=1
 *
 * Supports both symbolic ('active'/'inactive') and boolean (0/1) values.
 */
class StatusFilter
{
    public function handle(Builder $query, Closure $next): Builder
    {
        $status = request('status');
        $isActive = request('is_active');

        if ($status !== null) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        } elseif ($isActive !== null) {
            $query->where('is_active', (bool) $isActive);
        }

        return $next($query);
    }
}
