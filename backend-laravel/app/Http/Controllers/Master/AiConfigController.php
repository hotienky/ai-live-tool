<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AiConfigController extends Controller
{
    /**
     * Available AI providers and models.
     */
    private array $availableModels = [
        'gemini' => [
            'name' => 'Google Gemini',
            'models' => [
                'gemini-2.0-flash' => ['label' => 'Gemini 2.0 Flash', 'cost' => '$0.10/$0.40 per 1M tokens', 'tier' => 'budget'],
                'gemini-1.5-flash' => ['label' => 'Gemini 1.5 Flash', 'cost' => '$0.075/$0.30 per 1M tokens', 'tier' => 'budget'],
                'gemini-1.5-pro' => ['label' => 'Gemini 1.5 Pro', 'cost' => '$1.25/$5.00 per 1M tokens', 'tier' => 'standard'],
            ],
            'key_label' => 'Google AI API Key',
            'key_url' => 'https://aistudio.google.com/apikey',
        ],
        'openai' => [
            'name' => 'OpenAI',
            'models' => [
                'gpt-4o-mini' => ['label' => 'GPT-4o Mini', 'cost' => '$0.15/$0.60 per 1M tokens', 'tier' => 'budget'],
                'gpt-4o' => ['label' => 'GPT-4o', 'cost' => '$2.50/$10.00 per 1M tokens', 'tier' => 'standard'],
                'gpt-4-turbo' => ['label' => 'GPT-4 Turbo', 'cost' => '$10.00/$30.00 per 1M tokens', 'tier' => 'premium'],
            ],
            'key_label' => 'OpenAI API Key',
            'key_url' => 'https://platform.openai.com/api-keys',
        ],
        'anthropic' => [
            'name' => 'Anthropic',
            'models' => [
                'claude-3-haiku-20240307' => ['label' => 'Claude 3 Haiku', 'cost' => '$0.25/$1.25 per 1M tokens', 'tier' => 'budget'],
                'claude-3-5-sonnet-20241022' => ['label' => 'Claude 3.5 Sonnet', 'cost' => '$3.00/$15.00 per 1M tokens', 'tier' => 'standard'],
            ],
            'key_label' => 'Anthropic API Key',
            'key_url' => 'https://console.anthropic.com/keys',
        ],
    ];

    /**
     * Get current system AI configuration.
     */
    public function getConfig()
    {
        $provider = config('services.ai.provider', 'gemini');
        $model = config("services.ai.{$provider}.model", 'gemini-2.0-flash');

        // Check which keys are configured
        $keysConfigured = [];
        foreach (['gemini', 'openai', 'anthropic'] as $p) {
            $key = config("services.ai.{$p}.key", '');
            $keysConfigured[$p] = !empty($key);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'provider' => $provider,
                'model' => $model,
                'keys_configured' => $keysConfigured,
                'available_models' => $this->availableModels,
            ],
        ]);
    }

    /**
     * Update system AI configuration.
     */
    public function updateConfig(Request $request)
    {
        $request->validate([
            'provider' => 'required|in:gemini,openai,anthropic',
            'model' => 'required|string',
            'api_key' => 'nullable|string|max:200',
        ]);

        $provider = $request->input('provider');
        $model = $request->input('model');
        $apiKey = $request->input('api_key');

        // Update .env file
        $envPath = base_path('.env');
        $envContent = file_get_contents($envPath);

        $updates = [
            'AI_PROVIDER' => $provider,
            strtoupper($provider) . '_API_KEY' => $apiKey ?: config("services.ai.{$provider}.key", ''),
            strtoupper($provider) . '_MODEL' => $model,
        ];

        foreach ($updates as $key => $value) {
            if (preg_match("/^{$key}=.*/m", $envContent)) {
                $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $envContent);
            } else {
                $envContent .= "\n{$key}={$value}";
            }
        }

        file_put_contents($envPath, $envContent);

        // Clear config cache
        try {
            \Artisan::call('config:clear');
        } catch (\Exception $e) {
            // Ignore if fails
        }

        return response()->json([
            'success' => true,
            'message' => "Đã cập nhật cấu hình AI: {$provider} / {$model}",
        ]);
    }

    /**
     * Get AI usage stats across all tenants.
     */
    public function getAllUsage(Request $request)
    {
        $from = $request->input('from', now()->startOfMonth()->toDateTimeString());
        $to = $request->input('to', now()->toDateTimeString());

        // Overall totals
        $totals = AiUsageLog::whereBetween('created_at', [$from, $to])
            ->selectRaw('
                COUNT(*) as total_requests,
                COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
                COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(estimated_cost), 0) as total_cost
            ')
            ->first();

        // Per-tenant breakdown
        $byTenant = AiUsageLog::whereBetween('created_at', [$from, $to])
            ->selectRaw('tenant_id, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as tokens, COALESCE(SUM(estimated_cost), 0) as cost')
            ->groupBy('tenant_id')
            ->orderByDesc('tokens')
            ->limit(50)
            ->get();

        // By action
        $byAction = AiUsageLog::whereBetween('created_at', [$from, $to])
            ->selectRaw('action, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as tokens, COALESCE(SUM(estimated_cost), 0) as cost')
            ->groupBy('action')
            ->orderByDesc('tokens')
            ->get();

        // By key_mode
        $byKeyMode = AiUsageLog::whereBetween('created_at', [$from, $to])
            ->selectRaw('key_mode, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as tokens, COALESCE(SUM(estimated_cost), 0) as cost')
            ->groupBy('key_mode')
            ->get();

        // Recent logs
        $recent = AiUsageLog::orderByDesc('created_at')
            ->limit(30)
            ->get(['tenant_id', 'user_id', 'action', 'provider', 'model', 'key_mode', 'total_tokens', 'estimated_cost', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => [
                'period' => compact('from', 'to'),
                'totals' => $totals,
                'by_tenant' => $byTenant,
                'by_action' => $byAction,
                'by_key_mode' => $byKeyMode,
                'recent' => $recent,
            ],
        ]);
    }

    /**
     * Get usage for a specific tenant.
     */
    public function getTenantUsage(Request $request, string $tenantId)
    {
        $from = $request->input('from', now()->startOfMonth()->toDateTimeString());
        $to = $request->input('to', now()->toDateTimeString());

        $stats = AiUsageLog::getStats($tenantId, $from, $to);

        $recent = AiUsageLog::where('tenant_id', $tenantId)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'tenant_id' => $tenantId,
                'period' => compact('from', 'to'),
                'stats' => $stats,
                'recent' => $recent,
            ],
        ]);
    }
}
