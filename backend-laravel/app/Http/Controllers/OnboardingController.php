<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SiteTemplateService;
use Illuminate\Support\Facades\Log;

class OnboardingController extends Controller
{
    /**
     * Lấy danh sách templates
     */
    public function getTemplates()
    {
        Log::info('getTemplates API hit by tenant: ' . tenant('id'));
        $templates = SiteTemplateService::listTemplates();
        Log::info('Found templates count: ' . count($templates));
        
        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Apply template
     */
    public function applyTemplate(Request $request)
    {
        $request->validate([
            'template_id' => 'required|string'
        ]);

        $tenantId = tenant('id'); // Assumes we are in a tenant context
        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'Not in a tenant context'], 400);
        }

        try {
            $result = SiteTemplateService::applyTemplate($tenantId, $request->input('template_id'));
            return response()->json($result, $result['success'] ? 200 : 400);
        } catch (\Exception $e) {
            \Log::error("Onboarding apply failed: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra khi áp dụng template: ' . $e->getMessage()], 500);
        }
    }
}
