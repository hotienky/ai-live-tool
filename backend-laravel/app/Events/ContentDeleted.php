<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after content is deleted.
 */
class ContentDeleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $contentType,
        public int $contentId,
    ) {}
}
