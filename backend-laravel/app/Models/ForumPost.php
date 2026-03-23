<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ForumPost extends Model
{
    protected $table = 'forum_posts';

    protected $fillable = ['thread_id', 'author_id', 'author_name', 'body'];

    public function thread()
    {
        return $this->belongsTo(ForumThread::class, 'thread_id');
    }
}
