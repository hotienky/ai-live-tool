<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SiteTemplateService;
use App\Services\IndustryPresets;
use Illuminate\Support\Facades\Log;

class OnboardingController extends Controller
{
    /**
     * Get available industry presets (Shopify-style "What do you sell?")
     */
    public function getIndustries()
    {
        return response()->json([
            'success' => true,
            'data' => IndustryPresets::all(),
        ]);
    }

    /**
     * Lấy danh sách templates
     */
    public function getTemplates(Request $request)
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
     * Apply template + auto-install industry modules
     */
    public function applyTemplate(Request $request)
    {
        $request->validate([
            'template_id' => 'required|string',
            'site_info' => 'nullable|array',
            'industry' => 'nullable|string',
        ]);

        $tenantId = tenant('id');
        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'Not in a tenant context'], 400);
        }

        try {
            // 1. Auto-install modules for chosen industry (Shopify-style)
            $industry = $request->input('industry', 'ecommerce');
            $userId = auth()->id();
            $presetResult = IndustryPresets::applyPreset($tenantId, $industry, $userId);

            Log::info("[Onboarding] Industry preset applied", [
                'tenant' => $tenantId,
                'industry' => $industry,
                'installed' => $presetResult['installed'],
                'errors' => $presetResult['errors'],
            ]);

            // 2. Apply visual template (layout, theme, pages)
            $result = SiteTemplateService::applyTemplate(
                $tenantId,
                $request->input('template_id'),
                $request->input('site_info', [])
            );

            // Merge messages
            $result['industry'] = $industry;
            $result['modules_installed'] = $presetResult['installed'];

            return response()->json($result, $result['success'] ? 200 : 400);
        } catch (\Exception $e) {
            Log::error("Onboarding apply failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi khởi tạo: ' . $e->getMessage(),
            ], 500);
        }
    }
}
