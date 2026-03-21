<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [
        'template_id',
        'name',
        'author_id',
        'industry',
        'category',
        'tags',
        'price',
        'rating',
        'install_count',
        'preview_url',
        'screenshots',
        'description',
        'features',
        'requires_modules',
        'theme_config',
        'pages_config',
        'sample_data',
        'is_active',
        'is_featured',
        'version',
    ];

    protected $casts = [
        'tags' => 'array',
        'screenshots' => 'array',
        'features' => 'array',
        'requires_modules' => 'array',
        'theme_config' => 'array',
        'pages_config' => 'array',
        'sample_data' => 'array',
        'price' => 'decimal:0',
        'rating' => 'decimal:1',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    public function reviews()
    {
        return $this->hasMany(TemplateReview::class);
    }

    public function installs()
    {
        return $this->hasMany(TemplateInstall::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)->where('is_active', true);
    }

    public function scopeByIndustry($query, string $industry)
    {
        return $query->where('industry', $industry);
    }

    public function scopeFree($query)
    {
        return $query->where('price', 0);
    }
}
