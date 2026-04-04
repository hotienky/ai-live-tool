<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TenantContentType extends Model
{
    protected $table = 'tenant_content_types';

    protected $fillable = [
        'tenant_id',
        'type_key',
        'name',
        'singular_name',
        'icon',
        'supports',
        'meta_fields',
        'has_revisions',
        'has_comments'
    ];

    protected $casts = [
        'supports' => 'array',
        'meta_fields' => 'array',
        'has_revisions' => 'boolean',
        'has_comments' => 'boolean',
    ];

    protected static function booted(): void
    {
        // Auto-inject tenant_id
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = tenant('id') ?? null;
            if ($tenantId) {
                $builder->where('tenant_content_types.tenant_id', $tenantId);
            }
        });

        static::creating(function (self $model) {
            if (empty($model->tenant_id)) {
                $model->tenant_id = tenant('id') ?? null;
            }
        });
    }
}
