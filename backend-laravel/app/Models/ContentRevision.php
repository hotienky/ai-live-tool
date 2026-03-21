<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentRevision extends Model
{
    protected $table = 'content_revisions';

    protected $fillable = ['content_id', 'title', 'body', 'meta', 'revised_by'];

    protected $casts = [
        'meta' => 'array',
    ];

    public function content()
    {
        return $this->belongsTo(Content::class);
    }

    public function revisedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'revised_by');
    }
}
