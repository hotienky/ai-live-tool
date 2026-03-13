<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(\App\Repositories\Product\ProductRepositoryInterface::class, \App\Repositories\Product\ProductRepository::class);
        $this->app->bind(\App\Repositories\Order\OrderRepositoryInterface::class, \App\Repositories\Order\OrderRepository::class);
        $this->app->bind(\App\Repositories\Category\CategoryRepositoryInterface::class, \App\Repositories\Category\CategoryRepository::class);
        $this->app->bind(\App\Repositories\Brand\BrandRepositoryInterface::class, \App\Repositories\Brand\BrandRepository::class);
        $this->app->bind(\App\Repositories\Banner\BannerRepositoryInterface::class, \App\Repositories\Banner\BannerRepository::class);
        $this->app->bind(\App\Repositories\CmsPage\CmsPageRepositoryInterface::class, \App\Repositories\CmsPage\CmsPageRepository::class);
        $this->app->bind(\App\Repositories\Lead\LeadRepositoryInterface::class, \App\Repositories\Lead\LeadRepository::class);
        $this->app->bind(\App\Repositories\Customer\CustomerRepositoryInterface::class, \App\Repositories\Customer\CustomerRepository::class);
        $this->app->bind(\App\Repositories\Keyword\KeywordRepositoryInterface::class, \App\Repositories\Keyword\KeywordRepository::class);
        $this->app->bind(\App\Repositories\Promotion\PromotionRepositoryInterface::class, \App\Repositories\Promotion\PromotionRepository::class);
        $this->app->bind(\App\Repositories\NavLink\NavLinkRepositoryInterface::class, \App\Repositories\NavLink\NavLinkRepository::class);
        $this->app->bind(\App\Repositories\Shop\ShopRepositoryInterface::class, \App\Repositories\Shop\ShopRepository::class);
        $this->app->bind(\App\Repositories\Session\SessionRepositoryInterface::class, \App\Repositories\Session\SessionRepository::class);
        $this->app->bind(\App\Repositories\Role\RoleRepositoryInterface::class, \App\Repositories\Role\RoleRepository::class);
        $this->app->bind(\App\Repositories\ShopCustomer\ShopCustomerRepositoryInterface::class, \App\Repositories\ShopCustomer\ShopCustomerRepository::class);
        $this->app->bind(\App\Repositories\User\UserRepositoryInterface::class, \App\Repositories\User\UserRepository::class);
        $this->app->bind(\App\Repositories\Webhook\WebhookRepositoryInterface::class, \App\Repositories\Webhook\WebhookRepository::class);
        $this->app->bind(\App\Repositories\ActivityLog\ActivityLogRepositoryInterface::class, \App\Repositories\ActivityLog\ActivityLogRepository::class);
        $this->app->bind(\App\Repositories\ApiKey\ApiKeyRepositoryInterface::class, \App\Repositories\ApiKey\ApiKeyRepository::class);
        $this->app->bind(\App\Repositories\Language\LanguageRepositoryInterface::class, \App\Repositories\Language\LanguageRepository::class);
        $this->app->bind(\App\Repositories\CustomField\CustomFieldRepositoryInterface::class, \App\Repositories\CustomField\CustomFieldRepository::class);
        $this->app->bind(\App\Repositories\FlashSale\FlashSaleRepositoryInterface::class, \App\Repositories\FlashSale\FlashSaleRepository::class);
        $this->app->bind(\App\Repositories\Coupon\CouponRepositoryInterface::class, \App\Repositories\Coupon\CouponRepository::class);
        $this->app->bind(\App\Repositories\Cart\CartRepositoryInterface::class, \App\Repositories\Cart\CartRepository::class);
        $this->app->bind(\App\Repositories\Template\TemplateRepositoryInterface::class, \App\Repositories\Template\TemplateRepository::class);
        $this->app->bind(\App\Repositories\Notification\NotificationRepositoryInterface::class, \App\Repositories\Notification\NotificationRepository::class);
        $this->app->bind(\App\Repositories\Tenant\TenantRepositoryInterface::class, \App\Repositories\Tenant\TenantRepository::class);
        $this->app->bind(\App\Repositories\MasterUser\MasterUserRepositoryInterface::class, \App\Repositories\MasterUser\MasterUserRepository::class);
    }

    public function boot(): void {}
}
