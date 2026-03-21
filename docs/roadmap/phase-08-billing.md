# Phase 8: Billing & Subscriptions 💳

> **Priority**: 🟠 Medium  
> **Duration**: 2–3 weeks  
> **Depends on**: Phase 5 (Public API — for usage tracking)

---

## Mục tiêu

Monetize platform: subscription plans, payment integration, usage tracking, feature gating, module marketplace revenue.

---

## Tasks

### 8.1 Subscription Plans Database

**Tạo mới migrations**:

```sql
-- Master DB
plans: id, name, slug, price, billing_cycle (monthly/yearly), 
       limits (JSONB), features (JSONB), is_active, sort_order

-- limits example:
{
  "sites": 1,
  "pages": 5,
  "storage_mb": 500,
  "api_requests_per_hour": 100,
  "modules_free": 3,
  "modules_paid": 0,
  "custom_domains": 0,
  "users": 2,
  "headless_mode": false
}

subscriptions: id, tenant_id, plan_id, status (active/cancelled/past_due),
               trial_ends_at, current_period_start, current_period_end,
               cancelled_at, payment_method

invoices: id, tenant_id, subscription_id, amount, status (pending/paid/failed),
          payment_method, payment_ref, issued_at, paid_at, due_at

usage_records: id, tenant_id, metric (storage/api_calls/bandwidth),
               value, recorded_at
```

### 8.2 BillingService (Backend)

**Tạo mới**: `backend-laravel/app/Services/BillingService.php`

```php
class BillingService
{
    // Plan management
    public static function getPlans(): array { /* */ }
    public static function getTenantPlan(string $tenantId): Plan { /* */ }
    
    // Feature gating
    public static function canCreate(string $tenantId, string $resource): bool
    {
        $plan = self::getTenantPlan($tenantId);
        $limits = $plan->limits;
        
        switch ($resource) {
            case 'page':
                return Content::ofType('page')->count() < $limits['pages'];
            case 'module':
                return TenantModuleSubscription::active()->count() < $limits['modules_free'];
            case 'api_key':
                return $limits['headless_mode'] === true;
        }
        return true;
    }
    
    // Usage tracking
    public static function trackUsage(string $tenantId, string $metric, float $value): void { /* */ }
    public static function getUsage(string $tenantId, string $metric, string $period): float { /* */ }
    
    // Invoicing
    public static function createInvoice(string $tenantId): Invoice { /* */ }
    public static function processPayment(Invoice $invoice, string $method): bool { /* */ }
}
```

### 8.3 Feature Gating Middleware

**Tạo mới**: `backend-laravel/app/Http/Middleware/PlanLimits.php`

```php
// Tự động check plan limits trước khi allow actions
Route::middleware('plan.limit:pages,5')->group(function () {
    Route::post('cms-pages', [CmsPagesController::class, 'store']);
});
```

### 8.4 Payment Integration

**Priority order**:
1. **VNPay** — phổ biến nhất VN
2. **MoMo** — mobile payments
3. **Stripe** — international

**Tạo mới**: 
```
backend-laravel/app/Services/Payment/
  ├── PaymentGateway.php      ← interface
  ├── VnPayGateway.php
  ├── MoMoGateway.php
  └── StripeGateway.php
```

### 8.5 Frontend — Billing UI

**Tạo mới**:
```
frontend/src/components/
  ├── BillingPage.vue          — current plan, usage stats, invoices
  ├── PlanSelector.vue         — upgrade/downgrade plans
  ├── InvoiceList.vue          — billing history
  └── PaymentMethodForm.vue    — add/change payment method
```

```
frontend-master/src/components/   (Master Admin)
  ├── RevenueDashboard.vue     — MRR, churn, growth charts
  ├── TenantBilling.vue        — manage tenant subscriptions
  └── ModuleRequests.vue       — approve/reject paid module requests
```

### 8.6 Module Marketplace Revenue

- Paid modules: tenant pays → 70% to developer, 30% to platform
- Track module installs/uninstalls for billing
- Developer payout system

### 8.7 Admin Dashboard (Master) Enhancement

**File modify**: `frontend-master/`

- Revenue dashboard: MRR, ARR, churn rate, growth
- Tenant management: list, plan, usage, suspend
- Module approval queue for paid modules
- System health: DB usage, storage, API calls

---

## Checklist

- [ ] Create `plans`, `subscriptions`, `invoices`, `usage_records` migrations
- [ ] Create `Plan`, `Subscription`, `BillingInvoice`, `UsageRecord` models
- [ ] `BillingService` — plan management, feature gating, usage tracking
- [ ] `PlanLimits` middleware — auto-check before actions
- [ ] VNPay payment gateway integration
- [ ] MoMo payment gateway integration
- [ ] Auto-invoicing (monthly cron job)
- [ ] Frontend `BillingPage.vue`
- [ ] Frontend `PlanSelector.vue` with upgrade/downgrade flow
- [ ] Master `RevenueDashboard.vue`
- [ ] Trial period (14 days Pro)
- [ ] Grace period for failed payments (3 days)
- [ ] Tenant suspension on non-payment
- [ ] Module marketplace commission tracking

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `backend-laravel/database/migrations/` (4 new tables) |
| **CREATE** | `backend-laravel/app/Models/Plan.php` |
| **CREATE** | `backend-laravel/app/Models/Subscription.php` |
| **CREATE** | `backend-laravel/app/Models/BillingInvoice.php` |
| **CREATE** | `backend-laravel/app/Models/UsageRecord.php` |
| **CREATE** | `backend-laravel/app/Services/BillingService.php` |
| **CREATE** | `backend-laravel/app/Services/Payment/` (3 gateways) |
| **CREATE** | `backend-laravel/app/Http/Middleware/PlanLimits.php` |
| **CREATE** | `frontend/src/components/BillingPage.vue` |
| **CREATE** | `frontend/src/components/PlanSelector.vue` |
| **CREATE** | `frontend-master/src/components/RevenueDashboard.vue` |
| **MODIFY** | `backend-laravel/app/Http/Kernel.php` — register middleware |
| **MODIFY** | `backend-laravel/routes/tenant.php` — plan limits on routes |
