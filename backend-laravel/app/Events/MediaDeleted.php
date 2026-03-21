<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a media file is deleted.
 *
 * Listeners can perform post-delete actions like:
 * - Cleaning up CDN cache
 * - Removing from search indexes
 * - Notifying external services
 */
class MediaDeleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $mediaId,
        public string $filename,
        public string $path,
    ) {}
}
