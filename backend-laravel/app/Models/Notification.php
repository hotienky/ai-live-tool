<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'data'     => 'array',
        'roles'    => 'array',
        'is_read'  => 'boolean',
        'read_at'  => 'datetime',
        'expires_at' => 'datetime',
    ];

    // Chỉ có created_at, không dùng updated_at
    const UPDATED_AT = null;

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeNotExpired($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
