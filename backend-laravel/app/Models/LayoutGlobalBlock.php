<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LayoutGlobalBlock extends Model
{
    protected $fillable = [
        'tenant_id', 'ref', 'name', 'block_json'
    ];

    protected $casts = [
        'block_json' => 'array',
    ];

    protected static function booted(): void
    {
        // P1: Auto-inject tenant_id into queries
        static::addGlobalScope('tenant', function (\Illuminate\Database\Eloquent\Builder $builder) {
            $tenantId = tenant('id') ?? null;
            if ($tenantId) {
                $builder->where('layout_global_blocks.tenant_id', $tenantId);
            }
        });

        static::creating(function (self $model) {
            if (empty($model->tenant_id)) {
                $model->tenant_id = tenant('id') ?? null;
            }
        });
    }
}
