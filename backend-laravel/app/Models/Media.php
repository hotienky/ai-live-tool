<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    protected $table = 'media';

    protected $fillable = [
        'filename', 'disk', 'path', 'mime_type', 'size',
        'width', 'height', 'alt', 'title',
        'thumbnails', 'metadata',
    ];

    protected $casts = [
        'thumbnails' => 'array',
        'metadata'   => 'array',
        'size'       => 'integer',
        'width'      => 'integer',
        'height'     => 'integer',
    ];

    protected $appends = ['url', 'thumbnail_url', 'medium_url'];

    /**
     * Build full URL for a storage path.
     * Uses request host to generate correct absolute URL.
     */
    private function buildUrl(string $filePath): string
    {
        // Determine which disk to use for URL generation
        // 'public' and 'media' both use the central 'media' disk (avoids Stancl override)
        $urlDisk = in_array($this->disk, ['public', 'media']) ? 'media' : $this->disk;

        if ($this->isCloudDisk()) {
            return Storage::disk($urlDisk)->url($filePath);
        }

        // For local disk: use Storage url() then fix base to actual request host
        $storageUrl = Storage::disk($urlDisk)->url($filePath);

        // Replace APP_URL base with actual request host
        $appUrl = rtrim(config('app.url', 'http://localhost'), '/');
        $requestBase = request()->getSchemeAndHttpHost();

        if ($appUrl !== $requestBase && !empty($requestBase)) {
            $storageUrl = str_replace($appUrl, $requestBase, $storageUrl);
        }

        return $storageUrl;
    }

    /**
     * Full URL to the original file.
     */
    public function getUrlAttribute(): string
    {
        return $this->buildUrl($this->path);
    }

    /**
     * URL to the thumbnail version.
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        $thumbs = $this->thumbnails;
        if (!empty($thumbs['thumb'])) {
            return $this->buildUrl($thumbs['thumb']);
        }
        return $this->url;
    }

    /**
     * URL to the medium version.
     */
    public function getMediumUrlAttribute(): ?string
    {
        $thumbs = $this->thumbnails;
        if (!empty($thumbs['medium'])) {
            return $this->buildUrl($thumbs['medium']);
        }
        return $this->url;
    }

    /**
     * Check if media is stored on a cloud disk.
     */
    private function isCloudDisk(): bool
    {
        return in_array($this->disk, ['s3', 'firebase', 'vstorage', 'tenant_cloud']);
    }

    /**
     * Get URL for a specific thumbnail size.
     */
    public function thumbnailUrl(string $size = 'thumb'): ?string
    {
        $thumbs = $this->thumbnails;
        if (!empty($thumbs[$size])) {
            return Storage::disk($this->disk)->url($thumbs[$size]);
        }
        return $this->url;
    }

    /**
     * Check if this is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Human-readable file size.
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }
}
