<?php

namespace App\Events\Tenant;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SettingsChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $group,        // 'shop', 'payment', 'shipping', v.v.
        public readonly array  $changedKeys,
        public readonly int    $changedByUserId,
    ) {}
}
