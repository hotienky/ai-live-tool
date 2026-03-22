<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUsageLog extends Model
{
    public $timestamps = false;
    protected $guarded = ['id'];

    protected $casts = [
        'prompt_tokens' => 'integer',
        'completion_tokens' => 'integer',
        'total_tokens' => 'integer',
        'estimated_cost' => 'float',
        'created_at' => 'datetime',
    ];

    /**
     * Log an AI usage entry.
     */
    public static function logUsage(array $data): self
    {
        return self::create([
            'tenant_id' => $data['tenant_id'] ?? tenant('id'),
            'user_id' => $data['user_id'] ?? auth()->id(),
            'action' => $data['action'] ?? 'general',
            'provider' => $data['provider'] ?? 'openai',
            'model' => $data['model'] ?? 'gpt-4o-mini',
            'key_mode' => $data['key_mode'] ?? 'system',
            'prompt_tokens' => $data['prompt_tokens'] ?? 0,
            'completion_tokens' => $data['completion_tokens'] ?? 0,
            'total_tokens' => $data['total_tokens'] ?? 0,
            'estimated_cost' => $data['estimated_cost'] ?? 0,
        ]);
    }

    /**
     * Get usage stats for a tenant in a date range.
     */
    public static function getStats(string $tenantId, ?string $from = null, ?string $to = null): array
    {
        $query = self::where('tenant_id', $tenantId);
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to);

        $totals = $query->selectRaw('
            COUNT(*) as total_requests,
            COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
            COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
            COALESCE(SUM(total_tokens), 0) as total_tokens,
            COALESCE(SUM(estimated_cost), 0) as total_cost
        ')->first();

        // By action breakdown
        $byAction = self::where('tenant_id', $tenantId)
            ->when($from, fn($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn($q) => $q->where('created_at', '<=', $to))
            ->selectRaw('action, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as tokens, COALESCE(SUM(estimated_cost), 0) as cost')
            ->groupBy('action')
            ->get();

        // By key_mode breakdown
        $byKeyMode = self::where('tenant_id', $tenantId)
            ->when($from, fn($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn($q) => $q->where('created_at', '<=', $to))
            ->selectRaw('key_mode, COUNT(*) as requests, COALESCE(SUM(total_tokens), 0) as tokens, COALESCE(SUM(estimated_cost), 0) as cost')
            ->groupBy('key_mode')
            ->get();

        return [
            'totals' => $totals,
            'by_action' => $byAction,
            'by_key_mode' => $byKeyMode,
        ];
    }
}
