<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LayoutPageVersion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'page_id', 'layout_json', 'status', 'scheduled_at', 'version', 'published_by', 'note',
    ];

    protected $casts = [
        'layout_json' => 'array',
        'version' => 'integer',
        'created_at' => 'datetime',
        'scheduled_at' => 'datetime',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(LayoutPage::class, 'page_id');
    }
}
