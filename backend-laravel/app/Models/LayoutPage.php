<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * P1 – Multi-tenant isolation:
 * Mọi bảng PHẢI có tenant_id. Model này sử dụng Global Scope để tự động
 * filter theo tenant_id trên mọi query, đảm bảo không bao giờ bypass.
 */
class LayoutPage extends Model
{
    protected $fillable = [
        'tenant_id', 'slug', 'title', 'layout_json', 'status', 'version', 'is_system', 'meta',
    ];

    protected static function booted(): void
    {
        // P1: Auto-inject tenant_id vào mọi query và khi tạo mới
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = tenant('id') ?? null;
            if ($tenantId) {
                $builder->where('layout_pages.tenant_id', $tenantId);
            }
        });

        static::creating(function (self $model) {
            if (empty($model->tenant_id)) {
                $model->tenant_id = tenant('id') ?? null;
            }
        });
    }

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

        // CDN Push Simulator (Phase 4): Write absolute static JSON file for storefront to consume without DB query
        try {
            $cdnPath = "cdn/tenants/{$this->tenant_id}/layout_published_{$this->slug}.json";
            \Illuminate\Support\Facades\Storage::disk('public')->put($cdnPath, json_encode($this->layout_json, JSON_UNESCAPED_UNICODE));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("CDN Push Failed: " . $e->getMessage());
        }

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

        // CDN Push Simulator (Phase 4): Rollback the static file
        try {
            $cdnPath = "cdn/tenants/{$this->tenant_id}/layout_published_{$this->slug}.json";
            \Illuminate\Support\Facades\Storage::disk('public')->put($cdnPath, json_encode($snapshot->layout_json, JSON_UNESCAPED_UNICODE));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("CDN Push Failed on Rollback: " . $e->getMessage());
        }

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
