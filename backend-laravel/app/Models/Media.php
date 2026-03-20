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
     * Full URL to the original file.
     * For local disk: relative /storage/ path (works with any domain).
     * For cloud disks: full URL from Storage driver.
     */
    public function getUrlAttribute(): string
    {
        if ($this->isCloudDisk()) {
            return Storage::disk($this->disk)->url($this->path);
        }
        return '/storage/' . $this->path;
    }

    /**
     * URL to the thumbnail version.
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        $thumbs = $this->thumbnails;
        if (!empty($thumbs['thumb'])) {
            if ($this->isCloudDisk()) {
                return Storage::disk($this->disk)->url($thumbs['thumb']);
            }
            return '/storage/' . $thumbs['thumb'];
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
            if ($this->isCloudDisk()) {
                return Storage::disk($this->disk)->url($thumbs['medium']);
            }
            return '/storage/' . $thumbs['medium'];
        }
        return $this->url;
    }

    /**
     * Check if media is stored on a cloud disk.
     */
    private function isCloudDisk(): bool
    {
        return in_array($this->disk, ['s3', 'firebase', 'vstorage']);
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
