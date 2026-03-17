<?php

namespace App\Traits;

use App\Models\ActivityLog;

/**
 * Provides a simple helper to write activity logs.
 * Uses request()->attributes->get('auth_user') for the current user.
 */
trait LogsActivity
{
    protected function logActivity(string $action, ?string $entityType = null, $entityId = null, ?array $data = null): void
    {
        try {
            $user = request()->attributes->get('auth_user');
            ActivityLog::create([
                'user_id'     => $user->id ?? null,
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'data'        => $data ? json_encode($data) : null,
                'created_at'  => now(),
            ]);
        } catch (\Throwable $e) {
            // Never let logging failures break the main operation
            logger()->warning('Activity log failed: ' . $e->getMessage());
        }
    }
}
