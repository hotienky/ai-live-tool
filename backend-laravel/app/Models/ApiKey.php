<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    protected $guarded = ['id'];
    protected $table = 'api_keys';

    protected $casts = [
        'is_active' => 'boolean',
        'allowed_origins' => 'array',
        'last_used_at' => 'datetime',
        'rate_limit' => 'integer',
        'usage_count' => 'integer',
    ];

    protected $hidden = ['key'];

    public function isPublic(): bool
    {
        return ($this->type ?? 'public') === 'public';
    }

    public function isSecret(): bool
    {
        return ($this->type ?? 'public') === 'secret';
    }

    /**
     * Generate a new API key with pk_ or sk_ prefix.
     */
    public static function generateKey(string $type = 'public'): string
    {
        $prefix = $type === 'secret' ? 'sk_live_' : 'pk_live_';
        return $prefix . Str::random(32);
    }
}
