<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * SupportedLanguage — Central DB model.
 * Master list of all languages the system supports.
 * Tenants pick from this list when adding languages.
 */
class SupportedLanguage extends Model
{
    protected $connection = 'master'; // Always use central DB, never tenant DB

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get available languages (active, not yet installed by tenant).
     */
    public static function getAvailableForTenant(): \Illuminate\Support\Collection
    {
        $installed = Language::pluck('code')->toArray();

        return static::where('is_active', true)
            ->whereNotIn('code', $installed)
            ->orderBy('sort')
            ->get();
    }
}
