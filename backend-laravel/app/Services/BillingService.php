<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\UsageRecord;
use Illuminate\Support\Facades\DB;
use App\Models\Content;
use App\Models\Tenant;

class BillingService
{
    /**
     * Get all active plans
     */
    public static function getPlans()
    {
        return Plan::where('is_active', true)->orderBy('sort_order')->get();
    }

    /**
     * Get the active subscription/plan for a tenant.
     * If no active subscription, return a default Free plan (mocked or from DB).
     */
    public static function getTenantPlan(string $tenantId): Plan
    {
        $subscription = Subscription::where('tenant_id', $tenantId)->active()->first();

        if ($subscription && $subscription->plan) {
            return $subscription->plan;
        }

        // Fallback to free plan if exists
        $freePlan = Plan::where('price', 0)->first();
        if ($freePlan) {
            return $freePlan;
        }

        // Hardcoded fallback if no free plan in DB
        return new Plan([
            'name' => 'Free',
            'slug' => 'free',
            'price' => 0,
            'limits' => [
                'sites' => 1,
                'pages' => 5,
                'storage_mb' => 200,
                'api_requests_per_hour' => 100,
                'modules_free' => 3,
                'modules_paid' => 0,
                'custom_domains' => 0,
                'users' => 1,
                'headless_mode' => false
            ],
            'features' => []
        ]);
    }

    /**
     * Check if a tenant can create a specific resource type based on plan limits.
     */
    public static function canCreate(string $tenantId, string $resource): bool
    {
        $plan = self::getTenantPlan($tenantId);
        $limits = $plan->limits ?? [];

        switch ($resource) {
            case 'page':
                $allowed = $limits['pages'] ?? 10;
                // Avoid using Tenant context directly if we don't have InitializeTenancyBySlug inside the service execution
                // We assume we are inside a tenant context here (run() or middleware).
                $current = Content::where('type', 'page')->count();
                return $current < $allowed;

            case 'module':
                $allowed = $limits['modules_free'] ?? 3;
                $current = DB::connection('master')
                    ->table('tenant_module_subscriptions')
                    ->where('tenant_id', $tenantId)
                    ->count();
                return $current < $allowed;

            case 'custom_domain':
                $allowed = $limits['custom_domains'] ?? 0;
                $current = DB::connection('master')
                    ->table('domains')
                    ->where('tenant_id', $tenantId)
                    ->count();
                // Subdomain doesn't count, assume domains where type='storefront'
                return $current < $allowed;

            case 'api_keys':
                return ($limits['headless_mode'] ?? false) === true;
                
            case 'user':
                $allowed = $limits['users'] ?? 2;
                $current = DB::table('users')->count(); // tenant users
                return $current < $allowed;
        }

        return true;
    }

    /**
     * Track usage for a metric.
     */
    public static function trackUsage(string $tenantId, string $metric, float $value): void
    {
        UsageRecord::create([
            'tenant_id' => $tenantId,
            'metric' => $metric,
            'value' => $value,
        ]);
    }

    /**
     * Get aggregated usage for a metric within the current billing period.
     */
    public static function getUsage(string $tenantId, string $metric, string $period = 'current_month'): float
    {
        $query = UsageRecord::where('tenant_id', $tenantId)->where('metric', $metric);

        if ($period === 'current_month') {
            $query->where('recorded_at', '>=', now()->startOfMonth());
        }

        return (float) $query->sum('value');
    }
}
