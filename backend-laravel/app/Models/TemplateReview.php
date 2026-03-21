<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateReview extends Model
{
    protected $fillable = [
        'template_id',
        'tenant_id',
        'rating',
        'review_text',
    ];

    protected $casts = [
        'rating' => 'decimal:1',
    ];

    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
