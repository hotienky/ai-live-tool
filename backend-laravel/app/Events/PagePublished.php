<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a CMS page is published.
 *
 * Listeners can perform post-publish actions like:
 * - Clearing page cache
 * - Rebuilding sitemap
 * - Sending notifications
 * - Pinging search engine crawlers
 */
class PagePublished
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $pageId,
        public ?string $title = null,
        public ?int $userId = null,
    ) {}
}
