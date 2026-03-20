<?php

namespace App\Events\Subscription;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ModuleSubscribed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $moduleId,
        public readonly string $moduleName,
        public readonly bool   $isActivation = true, // true = subscribe, false = unsubscribe
    ) {}
}
