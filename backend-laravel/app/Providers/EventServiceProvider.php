<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

use App\Events\Order\OrderPlaced;
use App\Events\Order\OrderCancelled;
use App\Events\Order\OrderStatusChanged;
use App\Events\Product\ReviewSubmitted;
use App\Events\Product\StockLow;
use App\Events\Tenant\SettingsChanged;
use App\Events\Subscription\PlanExpiring;
use App\Events\Subscription\ModuleSubscribed;

use App\Listeners\NotificationEventListener;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderPlaced::class => [
            [NotificationEventListener::class, 'handleOrderPlaced'],
        ],
        OrderCancelled::class => [
            [NotificationEventListener::class, 'handleOrderCancelled'],
        ],
        OrderStatusChanged::class => [
            [NotificationEventListener::class, 'handleOrderStatusChanged'],
        ],
        ReviewSubmitted::class => [
            [NotificationEventListener::class, 'handleReviewSubmitted'],
        ],
        StockLow::class => [
            [NotificationEventListener::class, 'handleStockLow'],
        ],
        SettingsChanged::class => [
            [NotificationEventListener::class, 'handleSettingsChanged'],
        ],
        PlanExpiring::class => [
            [NotificationEventListener::class, 'handlePlanExpiring'],
        ],
        ModuleSubscribed::class => [
            [NotificationEventListener::class, 'handleModuleSubscribed'],
        ],
    ];

    public function boot(): void {}

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
