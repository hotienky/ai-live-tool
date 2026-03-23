<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ForumThread extends Model
{
    protected $table = 'forum_threads';

    protected $fillable = [
        'category_id', 'title', 'body', 'author_id', 'author_name',
        'status', 'is_pinned', 'replies_count', 'views_count',
    ];

    protected $casts = ['is_pinned' => 'boolean'];

    public function category()
    {
        return $this->belongsTo(ForumCategory::class, 'category_id');
    }

    public function posts()
    {
        return $this->hasMany(ForumPost::class, 'thread_id');
    }
}
