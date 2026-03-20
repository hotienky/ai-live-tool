<?php

namespace App\Events\Subscription;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlanExpiring
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $tenantName,
        public readonly int    $daysLeft,    // 7, 3, hoặc 1
        public readonly ?string $expiresAt,
    ) {}
}
