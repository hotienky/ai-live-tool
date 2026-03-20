<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function translations()
    {
        return $this->hasMany(LanguageTranslation::class);
    }

    /**
     * Get the default (source/base) language code dynamically.
     * Whichever language has is_default=true is the source language.
     */
    public static function getDefaultCode(): string
    {
        return static::where('is_default', true)->value('code') ?? 'vi';
    }

    /** Check if this is the default (base/source) language */
    public function isBaseLanguage(): bool
    {
        return (bool) $this->is_default;
    }
}
