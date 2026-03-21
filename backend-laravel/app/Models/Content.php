<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Content extends Model
{
    use SoftDeletes;

    protected $table = 'contents';

    protected $fillable = [
        'type', 'slug', 'title', 'body', 'excerpt',
        'featured_image', 'status', 'author_id', 'meta', 'published_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'published_at' => 'datetime',
    ];

    // ── Relations ──

    public function taxonomies()
    {
        return $this->hasMany(ContentTaxonomy::class);
    }

    public function revisions()
    {
        return $this->hasMany(ContentRevision::class)->orderBy('id', 'desc');
    }

    public function author()
    {
        return $this->belongsTo(\App\Models\User::class, 'author_id');
    }

    // ── Scopes ──

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->where(function ($q) {
                         $q->whereNull('published_at')
                           ->orWhere('published_at', '<=', now());
                     });
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    // ── Helpers ──

    public function getMeta(string $key, $default = null)
    {
        return data_get($this->meta, $key, $default);
    }

    public function setMeta(string $key, $value): void
    {
        $meta = $this->meta ?? [];
        data_set($meta, $key, $value);
        $this->meta = $meta;
    }

    /**
     * Create a revision snapshot of the current state
     */
    public function createRevision(?int $userId = null): ContentRevision
    {
        return $this->revisions()->create([
            'title' => $this->title,
            'body' => $this->body,
            'meta' => $this->meta,
            'revised_by' => $userId,
        ]);
    }

    /**
     * Sync taxonomies for a given taxonomy type
     */
    public function syncTaxonomy(string $taxonomy, array $terms): void
    {
        // Remove existing terms for this taxonomy
        $this->taxonomies()->where('taxonomy', $taxonomy)->delete();

        // Add new terms
        foreach ($terms as $term) {
            if (!empty(trim($term))) {
                $this->taxonomies()->create([
                    'taxonomy' => $taxonomy,
                    'term' => trim($term),
                ]);
            }
        }
    }
}
