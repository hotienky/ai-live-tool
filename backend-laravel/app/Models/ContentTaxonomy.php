<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentTaxonomy extends Model
{
    protected $table = 'content_taxonomies';

    protected $fillable = ['content_id', 'taxonomy', 'term'];

    public function content()
    {
        return $this->belongsTo(Content::class);
    }
}
