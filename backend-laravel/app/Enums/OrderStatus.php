<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case PROCESSING = 'processing';
    case SHIPPED = 'shipped';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Chờ xác nhận',
            self::CONFIRMED => 'Đã xác nhận',
            self::PROCESSING => 'Đang xử lý',
            self::SHIPPED => 'Đang giao',
            self::DELIVERED => 'Đã giao',
            self::CANCELLED => 'Đã hủy',
            self::REFUNDED => 'Đã hoàn tiền',
        };
    }
}
