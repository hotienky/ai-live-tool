<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a module is installed for a tenant.
 * 
 * Listeners can:
 * - Run module-specific migrations
 * - Seed default data
 * - Send notification
 */
class ModuleInstalled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $moduleId,
        public string $tenantId,
        public array $moduleInfo = [],
    ) {}
}
