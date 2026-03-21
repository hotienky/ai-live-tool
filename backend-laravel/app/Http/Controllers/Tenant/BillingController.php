<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\BillingService;
use App\Models\Plan;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    /**
     * Get available plans
     */
    public function getPlans()
    {
        return response()->json([
            'success' => true,
            'data' => BillingService::getPlans()
        ]);
    }

    /**
     * Get current tenant's active plan and subscription details
     */
    public function currentPlan()
    {
        $tenantId = tenant('id');
        $plan = BillingService::getTenantPlan($tenantId);

        return response()->json([
            'success' => true,
            'data' => [
                'plan' => $plan,
                'limits' => $plan->limits,
            ]
        ]);
    }

    /**
     * Get current usage metrics
     */
    public function usage()
    {
        $tenantId = tenant('id');
        
        $metrics = [
            'pages' => \App\Models\Content::where('type', 'page')->count(),
            'storage_mb' => BillingService::getUsage($tenantId, 'storage'),
            'api_calls' => BillingService::getUsage($tenantId, 'api_calls'),
        ];

        return response()->json([
            'success' => true,
            'data' => $metrics
        ]);
    }

    /**
     * Upgrade or downgrade to a specific plan (Mock Implementation)
     */
    public function changePlan(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:master.plans,id',
            'payment_method' => 'string|nullable',
        ]);

        $tenantId = tenant('id');
        $newPlan = Plan::findOrFail($request->plan_id);

        /**
         * In real scenario: Compute prorated charges, create Stripe checkout, 
         * or generate VNPay/MoMo link via PaymentGateway for exact amount.
         */

        $subscription = \App\Models\Subscription::updateOrCreate(
            ['tenant_id' => $tenantId],
            [
                'plan_id' => $newPlan->id,
                'status' => 'active',
                'current_period_start' => now(),
                'current_period_end' => $newPlan->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Đã nâng cấp lên gói {$newPlan->name} thành công.",
            'data' => $subscription
        ]);
    }

    /**
     * Get invoices
     */
    public function invoices()
    {
        $tenantId = tenant('id');
        $invoices = \App\Models\BillingInvoice::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices
        ]);
    }
}
