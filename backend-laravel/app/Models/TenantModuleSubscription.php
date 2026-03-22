<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantModuleSubscription extends Model
{
    protected $connection = 'master';
    protected $table = 'tenant_module_subscriptions';

    protected $fillable = [
        'tenant_id', 'module_id', 'is_active', 'status',
        'request_note', 'installed_at', 'installed_by', 'installed_version',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'installed_at' => 'datetime',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class, 'module_id', 'module_id');
    }

    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class, 'tenant_id', 'id');
    }
}
