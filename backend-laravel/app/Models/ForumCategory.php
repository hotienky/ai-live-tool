<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ForumCategory extends Model
{
    protected $table = 'forum_categories';

    protected $fillable = ['name', 'description', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function threads()
    {
        return $this->hasMany(ForumThread::class, 'category_id');
    }
}
