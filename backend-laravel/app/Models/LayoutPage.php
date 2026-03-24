<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LayoutPage extends Model
{
    protected $fillable = [
        'slug', 'title', 'layout_json', 'status', 'version', 'is_system', 'meta',
    ];

    protected $casts = [
        'layout_json' => 'array',
        'meta' => 'array',
        'is_system' => 'boolean',
        'version' => 'integer',
    ];

    /* ── Relationships ── */

    public function versions(): HasMany
    {
        return $this->hasMany(LayoutPageVersion::class, 'page_id')->orderByDesc('version');
    }

    /* ── Business Logic ── */

    /**
     * Publish the current layout: snapshot current state into versions table, bump version.
     */
    public function publish(?string $publishedBy = null, ?string $note = null): self
    {
        // Save version snapshot
        $this->versions()->create([
            'layout_json' => $this->layout_json,
            'version' => $this->version,
            'published_by' => $publishedBy,
            'note' => $note,
        ]);

        // Bump version & set published
        $this->increment('version');
        $this->update(['status' => 'published']);

        return $this;
    }

    /**
     * Rollback to a specific version.
     */
    public function rollback(int $versionNumber): self
    {
        $snapshot = $this->versions()->where('version', $versionNumber)->firstOrFail();

        $this->update([
            'layout_json' => $snapshot->layout_json,
            'status' => 'published',
        ]);

        // Create a new version entry recording the rollback
        $this->versions()->create([
            'layout_json' => $snapshot->layout_json,
            'version' => $this->version,
            'published_by' => 'system',
            'note' => "Rollback to v{$versionNumber}",
        ]);

        $this->increment('version');

        return $this;
    }

    /**
     * Save as draft (update layout without publishing).
     */
    public function saveDraft(array $layoutJson): self
    {
        $this->update([
            'layout_json' => $layoutJson,
            'status' => 'draft',
        ]);

        return $this;
    }

    /* ── Scopes ── */

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeBySlug($query, string $slug)
    {
        return $query->where('slug', $slug);
    }
}
