<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'reviewable_type', 'reviewable_id',
        'author_name', 'author_email',
        'rating', 'content',
        'is_approved', 'is_featured',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'is_featured' => 'boolean',
        'rating' => 'integer',
    ];

    public function reviewable()
    {
        return $this->morphTo();
    }
}
