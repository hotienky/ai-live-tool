<?php

namespace App\Events\Broadcast;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast real-time thông báo tới admin client qua Laravel Reverb.
 * Implements ShouldBroadcastNow (không qua queue — gửi ngay lập tức).
 */
class NotificationBroadcast implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        private readonly array  $roles,   // ['super_admin', 'manager']
        private readonly array  $payload, // { type, title, message, data, link }
    ) {}

    /**
     * Broadcast tới tất cả private channels tương ứng với roles.
     * Frontend subscribe: Echo.private('admin.role.super_admin')
     */
    public function broadcastOn(): array
    {
        return array_map(
            fn(string $role) => new PrivateChannel("admin.role.{$role}"),
            $this->roles,
        );
    }

    public function broadcastAs(): string
    {
        return 'admin.notification';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
