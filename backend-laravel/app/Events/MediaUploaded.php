<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a media file is uploaded.
 *
 * Listeners can perform post-upload actions like:
 * - Optimizing images
 * - Generating additional thumbnails
 * - Syncing to CDN
 * - Updating search indexes
 */
class MediaUploaded
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $mediaId,
        public string $filename,
        public string $mimeType,
        public ?int $userId = null,
    ) {}
}
