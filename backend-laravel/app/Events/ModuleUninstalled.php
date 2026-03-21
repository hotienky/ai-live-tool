<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after a module is uninstalled from a tenant.
 */
class ModuleUninstalled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $moduleId,
        public string $tenantId,
    ) {}
}
