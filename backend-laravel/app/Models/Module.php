<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $connection = 'master';
    protected $table = 'modules';

    protected $fillable = [
        'module_id', 'name', 'description', 'icon', 'category',
        'version', 'price', 'is_active', 'sidebar', 'requires', 'config',
    ];

    protected $casts = [
        'price' => 'decimal:0',
        'is_active' => 'boolean',
        'sidebar' => 'array',
        'requires' => 'array',
        'config' => 'array',
    ];

    public function subscriptions()
    {
        return $this->hasMany(TenantModuleSubscription::class, 'module_id', 'module_id');
    }
}
