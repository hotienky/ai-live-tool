<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantModule extends Model
{
    protected $table = 'tenant_modules';

    protected $fillable = [
        'module_id', 'version', 'is_active', 'config',
        'installed_at', 'installed_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array',
        'installed_at' => 'datetime',
    ];
}
