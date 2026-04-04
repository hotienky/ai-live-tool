<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class NavigationMenu extends Model
{
    protected $table = 'navigation_menus';

    protected $fillable = [
        'tenant_id', 'name', 'location', 'json_data',
    ];

    protected $casts = [
        'json_data' => 'array',
    ];

    protected static function booted(): void
    {
        // Auto-inject tenant_id
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = tenant('id') ?? null;
            if ($tenantId) {
                $builder->where('navigation_menus.tenant_id', $tenantId);
            }
        });

        static::creating(function (self $model) {
            if (empty($model->tenant_id)) {
                $model->tenant_id = tenant('id') ?? null;
            }
        });
    }
}
