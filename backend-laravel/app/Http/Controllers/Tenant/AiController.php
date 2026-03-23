<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
use App\Models\SystemConfig;
use App\Services\AiService;
use App\Services\ModuleRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    /**
     * Check if AI module is installed for current tenant.
     */
    private function checkModuleInstalled(): ?array
    {
        try {
            $tenantId = tenant('id');
            if (!ModuleRegistry::isInstalled($tenantId, 'ai-assistant')) {
                return [
                    'success' => false,
                    'message' => 'Module AI Assistant chưa được cài đặt. Vui lòng cài đặt trong Hệ thống → Modules.',
                ];
            }
        } catch (\Exception $e) {
            // If tenant() fails, skip check (e.g., in testing)
            Log::warning("[AiController] Module check failed: {$e->getMessage()}");
        }
        return null;
    }

    /**
     * Resolve AI service with correct key mode for current tenant.
     * Priority: 1. Tenant's own key -> 2. Master's override -> 3. System global
     */
    private function resolveAiService(): AiService
    {
        $ai = new AiService();

        try {
            // 1. Tenant's Own Key
            $tenantKeyMode = SystemConfig::where('key', 'ai.tenant_key_mode')->value('value');
            $tenantOwnKey = SystemConfig::where('key', 'ai.tenant_api_key')->value('value');
            $tenantProvider = SystemConfig::where('key', 'ai.tenant_provider')->value('value') ?? 'openai';

            if ($tenantKeyMode === 'own' && !empty($tenantOwnKey)) {
                $ai->withTenantKey($tenantOwnKey, $tenantProvider);
                return $ai;
            }

            // 2. Master's Override Key
            $masterKeyMode = SystemConfig::where('key', 'ai.key_mode')->value('value') ?? 'system';
            $masterOwnKey = SystemConfig::where('key', 'ai.own_api_key')->value('value');
            $masterProvider = SystemConfig::where('key', 'ai.own_provider')->value('value') ?? 'openai';

            if ($masterKeyMode === 'own' && !empty($masterOwnKey)) {
                $ai->withTenantKey($masterOwnKey, $masterProvider);
                return $ai;
            }

            // 3. System Global
            $ai->setKeyMode('system');
        } catch (\Exception $e) {
            // Fallback to system key
            $ai->setKeyMode('system');
        }

        return $ai;
    }

    /**
     * Log AI usage after a successful request.
     */
    private function logUsage(AiService $ai, array $result, string $action): void
    {
        if (!($result['success'] ?? false)) return;

        try {
            $usage = $result['usage'] ?? [];
            AiUsageLog::logUsage([
                'tenant_id' => tenant('id'),
                'user_id' => auth()->id(),
                'action' => $action,
                'provider' => $ai->getProvider(),
                'model' => $ai->getModel(),
                'key_mode' => $ai->getKeyMode(),
                'prompt_tokens' => $usage['prompt_tokens'] ?? 0,
                'completion_tokens' => $usage['completion_tokens'] ?? 0,
                'total_tokens' => $usage['total_tokens'] ?? 0,
                'estimated_cost' => $usage['estimated_cost'] ?? 0,
            ]);
        } catch (\Exception $e) {
            Log::warning("[AiController] Usage logging failed: {$e->getMessage()}");
        }
    }

    /**
     * Generate content (main AI endpoint).
     */
    public function generate(Request $request)
    {
        // Module gate
        $gate = $this->checkModuleInstalled();
        if ($gate) return response()->json($gate, 403);

        $request->validate([
            'prompt' => 'required|string|max:5000',
            'type' => 'nullable|string|in:general,blog,product,seo,translate,tags,sales,layout',
        ]);

        $ai = $this->resolveAiService();
        $type = $request->input('type', 'general');

        $result = match ($type) {
            'blog' => $ai->generateBlogPost(
                $request->input('prompt'),
                $request->input('outline'),
                $request->input('tone', 'professional')
            ),
            'product' => $ai->generateProductDescription(
                $request->input('prompt'),
                $request->input('attributes', [])
            ),
            'seo' => $ai->generateSEO(
                $request->input('title', $request->input('prompt')),
                $request->input('content', '')
            ),
            'translate' => $ai->translate(
                $request->input('prompt'),
                $request->input('target_lang', 'en'),
                $request->input('context', 'general')
            ),
            'tags' => $ai->suggestTags(
                $request->input('prompt'),
                $request->input('categories', [])
            ),
            'sales' => $this->handleSalesCopy($ai, $request),
            'layout' => $this->handleLayoutGenerate($ai, $request),
            default => $ai->generate($request->input('prompt'), [
                'max_tokens' => $request->input('max_tokens', 2000),
                'temperature' => $request->input('temperature', 0.7),
                'system' => $request->input('system'),
            ]),
        };

        // Log usage
        $this->logUsage($ai, $result, $type);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'] ?? 'AI generation failed',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Batch translate multiple fields at once.
     */
    public function batchTranslate(Request $request)
    {
        $gate = $this->checkModuleInstalled();
        if ($gate) return response()->json($gate, 403);

        $request->validate([
            'fields' => 'required|array|min:1',
            'fields.*.key' => 'required|string',
            'fields.*.value' => 'required|string',
            'target_lang' => 'required|string|max:5',
            'context' => 'nullable|string|max:50',
        ]);

        $ai = $this->resolveAiService();
        $fields = $request->input('fields');
        $targetLang = $request->input('target_lang');
        $context = $request->input('context', 'e-commerce');

        $combined = collect($fields)->map(fn($f) => "[{$f['key']}]: {$f['value']}")->implode("\n---\n");

        $prompt = "Dịch các trường sau sang {$targetLang}. Giữ nguyên format [key]: value.\n\n{$combined}";

        $result = $ai->generate($prompt, [
            'system' => "Bạn là dịch giả chuyên nghiệp. Dịch chính xác từng trường, giữ nguyên key và format. Ngữ cảnh: {$context}.",
            'max_tokens' => 3000,
            'temperature' => 0.3,
        ]);

        $this->logUsage($ai, $result, 'batch_translate');

        return response()->json([
            'success' => $result['success'],
            'data' => $result,
        ], $result['success'] ? 200 : 500);
    }

    // ── AI Settings ──

    /**
     * Get AI settings for current tenant.
     */
    public function getSettings()
    {
        $gate = $this->checkModuleInstalled();
        if ($gate) return response()->json($gate, 403);

        try {
            $configs = SystemConfig::whereIn('key', [
                'ai.tenant_key_mode', 'ai.tenant_api_key', 'ai.tenant_provider',
                'ai.key_mode'
            ])->pluck('value', 'key');

            $tenantKeyMode = $configs['ai.tenant_key_mode'] ?? 'system';
            $tenantOwnKey = $configs['ai.tenant_api_key'] ?? '';
            $tenantProvider = $configs['ai.tenant_provider'] ?? 'openai';
            $masterKeyMode = $configs['ai.key_mode'] ?? 'system';

            // Mask API key for display
            $maskedKey = '';
            if ($tenantOwnKey) {
                $maskedKey = substr($tenantOwnKey, 0, 8) . '...' . substr($tenantOwnKey, -4);
            }

            // Check if system key is configured
            $systemKeyAvailable = !empty(config('services.ai.openai.key', '') ?: config('services.ai.anthropic.key', ''));

            return response()->json([
                'success' => true,
                'data' => [
                    'key_mode' => $tenantKeyMode,
                    'own_api_key_masked' => $maskedKey,
                    'own_provider' => $tenantProvider,
                    'has_own_key' => !empty($tenantOwnKey),
                    'master_key_mode' => $masterKeyMode,
                    'system_key_available' => $systemKeyAvailable,
                    'system_provider' => config('services.ai.provider', 'openai'),
                    'system_model' => config('services.ai.' . config('services.ai.provider', 'openai') . '.model', 'gpt-4o-mini'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Save AI settings for current tenant.
     */
    public function updateSettings(Request $request)
    {
        $gate = $this->checkModuleInstalled();
        if ($gate) return response()->json($gate, 403);

        $request->validate([
            'key_mode' => 'required|in:own,system',
            'own_api_key' => 'nullable|string|max:200',
            'own_provider' => 'nullable|in:openai,anthropic',
        ]);

        try {
            foreach ([
                'ai.tenant_key_mode' => $request->input('key_mode'),
                'ai.tenant_provider' => $request->input('own_provider', 'openai'),
            ] as $key => $value) {
                SystemConfig::updateOrCreate(['key' => $key], ['value' => $value]);
            }

            // Only update key if provided (don't overwrite with empty)
            if ($request->filled('own_api_key')) {
                SystemConfig::updateOrCreate(['key' => 'ai.tenant_api_key'], ['value' => $request->input('own_api_key')]);
            }

            return response()->json(['success' => true, 'message' => 'Đã lưu cài đặt AI của bạn']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get AI usage stats for current tenant.
     */
    public function getUsage(Request $request)
    {
        $gate = $this->checkModuleInstalled();
        if ($gate) return response()->json($gate, 403);

        try {
            $tenantId = tenant('id');
            $from = $request->input('from', now()->startOfMonth()->toDateTimeString());
            $to = $request->input('to', now()->toDateTimeString());

            $stats = AiUsageLog::getStats($tenantId, $from, $to);

            // Recent logs (latest 20)
            $recentLogs = AiUsageLog::where('tenant_id', $tenantId)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(['action', 'provider', 'model', 'key_mode', 'total_tokens', 'estimated_cost', 'created_at']);

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => ['from' => $from, 'to' => $to],
                    'stats' => $stats,
                    'recent' => $recentLogs,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Private Helpers ──

    /**
     * Generate a page layout_data JSON array from a prompt.
     */
    private function handleLayoutGenerate(AiService $ai, Request $request): array
    {
        $systemPrompt = <<<'PROMPT'
Bạn là AI page builder chuyên nghiệp. Tạo layout_data JSON cho trang web theo mô tả của người dùng.
QUAN TRỌNG: Chỉ trả về JSON array thuần túy, không có markdown, không có ```json, không có giải thích.

Mỗi section có cấu trúc: {"type":"...","enabled":true,"order":N,"params":{...},"content":[...]}

Các type và cấu trúc params/content:
- text_block: params={"title":"...","body":"<p>HTML nội dung...</p>"}, content=null
- faq: params={"title":"Câu hỏi thường gặp"}, content=[{"q":"...","a":"..."}]
- testimonials: params={"title":"Khách hàng nói gì"}, content=[{"name":"...","role":"...","text":"...","rating":5}]
- image_gallery: params={"title":"...","columns":3}, content=[{"src":"","alt":"...","caption":"..."}]
- trust_badges: params={"title":""}, content=[{"icon":"Shield","title":"...","desc":"..."}]
- newsletter: params={"title":"...","subtitle":"..."}, content=null
- custom_block: params={"title":"..."}, content="<p>HTML tự do...</p>"

Tạo 3-6 sections phù hợp với mô tả. Đánh số order bắt đầu từ 0.
PROMPT;

        return $ai->generate($request->input('prompt'), [
            'system' => $systemPrompt,
            'max_tokens' => 3000,
            'temperature' => 0.6,
        ]);
    }

    /**
     * Handle sales copy generation.
     */
    private function handleSalesCopy(AiService $ai, Request $request): array
    {
        $copyType = $request->input('copy_type', 'ad');
        $typeLabels = [
            'ad' => 'quảng cáo Google/Facebook Ads',
            'email' => 'email marketing',
            'social' => 'bài đăng social media (Facebook, Instagram, TikTok)',
            'promo' => 'chương trình khuyến mãi / flash sale',
            'landing' => 'landing page bán hàng',
            'sms' => 'tin nhắn SMS marketing',
            'push' => 'push notification',
        ];
        $typeLabel = $typeLabels[$copyType] ?? $copyType;

        $prompt = "Viết nội dung {$typeLabel} cho: \"{$request->input('prompt')}\".\n";
        if ($request->input('details')) {
            $prompt .= "Chi tiết: {$request->input('details')}\n";
        }
        if ($request->input('target_audience')) {
            $prompt .= "Đối tượng mục tiêu: {$request->input('target_audience')}\n";
        }
        $prompt .= "Yêu cầu:\n- Hấp dẫn, thu hút click\n- Có call-to-action mạnh\n- Phù hợp với format {$typeLabel}\n- Viết 3 phiên bản khác nhau (A/B/C testing)\n- Mỗi phiên bản đánh số rõ ràng";

        return $ai->generate($prompt, [
            'system' => 'Bạn là chuyên gia marketing digital và copywriting. Viết nội dung bán hàng sáng tạo, chuyên nghiệp.',
            'temperature' => 0.8,
            'max_tokens' => 2000,
        ]);
    }
}
