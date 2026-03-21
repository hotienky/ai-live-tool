<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after content (page, post, product, etc.) is saved/updated.
 * 
 * Listeners can perform post-save actions like:
 * - Clearing cache
 * - Sending notifications
 * - Syncing to external services
 * - Updating search indexes
 */
class ContentSaved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $contentType,
        public int $contentId,
        public array $data,
        public bool $isNew = false,
    ) {}
}
