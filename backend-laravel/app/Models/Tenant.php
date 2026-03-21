<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\DatabaseConfig;

/**
 * Tenant Model — Extends stancl/tenancy base with existing project schema.
 *
 * Maps to existing `tenants` table in master DB with columns:
 * id, slug, name, db_name, status, plan, data, timestamps
 *
 * Overrides database name resolution to use existing `db_name` column
 * instead of stancl's default prefix+id naming convention.
 */
class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $connection = 'master';

    // Ensure Eloquent casts the PK to string in relationship queries
    // because domains.tenant_id is varchar in PostgreSQL
    protected $keyType = 'string';

    protected $casts = [
        'settings' => 'array',
        'expires_at' => 'datetime',
    ];

    /**
     * Custom columns on the tenants table (not stored in JSON `data`).
     * Must list ALL real columns to prevent stancl from using `data` JSON column.
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'slug',
            'name',
            'db_name',
            'status',
            'plan',
            'owner_email',
            'owner_name',
            'custom_domain',
            'logo',
            'settings',
            'features',
            'expires_at',
        ];
    }

    /**
     * Boot: Override the database name generator to use `db_name` column.
     */
    protected static function booted(): void
    {
        parent::booted();

        DatabaseConfig::generateDatabaseNamesUsing(function (TenantWithDatabase $tenant) {
            return $tenant->db_name;
        });
    }

    /**
     * Convenience scope to find by slug.
     */
    public function scopeBySlug($query, string $slug)
    {
        return $query->where('slug', $slug);
    }

    /**
     * Active tenants only.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
