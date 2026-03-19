<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    /** Vietnamese is the system base language — cannot be deleted */
    public const BASE_LANGUAGE_CODE = 'vi';

    protected $guarded = ['id'];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function translations()
    {
        return $this->hasMany(LanguageTranslation::class);
    }

    /** Check if this is the system base language */
    public function isBaseLanguage(): bool
    {
        return $this->code === self::BASE_LANGUAGE_CODE;
    }
}
