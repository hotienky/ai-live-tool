<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Form extends Model
{
    protected $fillable = [
        'title', 'slug', 'fields', 'settings', 'is_active', 'submission_count',
    ];

    protected $casts = [
        'fields' => 'array',
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    public function submissions()
    {
        return $this->hasMany(FormSubmission::class);
    }
}
