<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * AI Content Generation Service
 * 
 * Supports OpenAI (GPT) and Anthropic (Claude) APIs.
 * Used for: content writing, product descriptions, SEO optimization, translations.
 * 
 * Supports dual-key mode:
 * - System key: platform's shared API key
 * - Tenant key: tenant provides their own API key
 */
class AiService
{
    protected string $provider;
    protected string $apiKey;
    protected string $model;
    protected string $keyMode = 'system'; // 'system' or 'own'

    // Pricing per 1M tokens (USD)
    protected array $pricing = [
        'gemini' => [
            'gemini-2.0-flash' => ['input' => 0.10, 'output' => 0.40],
            'gemini-1.5-flash' => ['input' => 0.075, 'output' => 0.30],
            'gemini-1.5-pro' => ['input' => 1.25, 'output' => 5.00],
        ],
        'openai' => [
            'gpt-4o-mini' => ['input' => 0.15, 'output' => 0.60],
            'gpt-4o' => ['input' => 2.50, 'output' => 10.00],
            'gpt-4-turbo' => ['input' => 10.00, 'output' => 30.00],
        ],
        'anthropic' => [
            'claude-3-haiku-20240307' => ['input' => 0.25, 'output' => 1.25],
            'claude-3-5-sonnet-20241022' => ['input' => 3.00, 'output' => 15.00],
        ],
    ];

    public function __construct()
    {
        $this->provider = config('services.ai.provider', 'gemini');
        $this->apiKey = config("services.ai.{$this->provider}.key", '');
        $this->model = config("services.ai.{$this->provider}.model", $this->getDefaultModel());
    }

    private function getDefaultModel(): string
    {
        return match ($this->provider) {
            'gemini' => 'gemini-2.0-flash',
            'openai' => 'gpt-4o-mini',
            'anthropic' => 'claude-3-haiku-20240307',
            default => 'gemini-2.0-flash',
        };
    }

    /**
     * Override with tenant's own API key.
     */
    public function withTenantKey(string $apiKey, ?string $provider = null, ?string $model = null): self
    {
        $this->apiKey = $apiKey;
        $this->keyMode = 'own';
        if ($provider) $this->provider = $provider;
        if ($model) $this->model = $model;
        return $this;
    }

    /**
     * Set key mode for tracking.
     */
    public function setKeyMode(string $mode): self
    {
        $this->keyMode = $mode;
        return $this;
    }

    public function getKeyMode(): string
    {
        return $this->keyMode;
    }

    public function getProvider(): string
    {
        return $this->provider;
    }

    public function getModel(): string
    {
        return $this->model;
    }

    /**
     * Generate content based on a prompt.
     * Returns: ['success', 'content', 'provider', 'model', 'usage' => [...]]
     */
    public function generate(string $prompt, array $options = []): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'error' => 'AI API key chưa được cấu hình. Vui lòng cấu hình trong AI Assistant → Cài đặt.',
            ];
        }

        $maxTokens = $options['max_tokens'] ?? 2000;
        $temperature = $options['temperature'] ?? 0.7;
        $systemPrompt = $options['system'] ?? 'Bạn là trợ lý viết nội dung chuyên nghiệp. Trả lời bằng tiếng Việt.';

        try {
            $result = match ($this->provider) {
                'gemini' => $this->callGemini($systemPrompt, $prompt, $maxTokens, $temperature),
                'openai' => $this->callOpenAI($systemPrompt, $prompt, $maxTokens, $temperature),
                'anthropic' => $this->callAnthropic($systemPrompt, $prompt, $maxTokens, $temperature),
                default => throw new \RuntimeException("Provider không hỗ trợ: {$this->provider}"),
            };

            return [
                'success' => true,
                'content' => $result['content'],
                'provider' => $this->provider,
                'model' => $this->model,
                'key_mode' => $this->keyMode,
                'usage' => $result['usage'],
            ];
        } catch (\Exception $e) {
            Log::error("[AiService] Generation failed: {$e->getMessage()}");
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Generate a blog post draft from an outline/topic.
     */
    public function generateBlogPost(string $topic, ?string $outline = null, string $tone = 'professional'): array
    {
        $prompt = "Viết một bài blog về chủ đề: \"{$topic}\".\n";
        if ($outline) $prompt .= "Dàn ý:\n{$outline}\n";
        $prompt .= "Yêu cầu:\n- Giọng văn: {$tone}\n- Có tiêu đề hấp dẫn\n- Có phần mở đầu, nội dung chính và kết luận\n- Sử dụng heading H2, H3 phù hợp\n- Độ dài: 800-1200 từ\n- Format: Markdown";

        return $this->generate($prompt, [
            'system' => 'Bạn là copywriter chuyên nghiệp, viết blog SEO-friendly bằng tiếng Việt. Sử dụng Markdown formatting.',
            'max_tokens' => 3000,
        ]);
    }

    /**
     * Generate product description from product name/attributes.
     */
    public function generateProductDescription(string $productName, array $attributes = []): array
    {
        $attrText = '';
        if (!empty($attributes)) {
            $attrText = "\nThông tin sản phẩm:\n";
            foreach ($attributes as $key => $value) {
                $attrText .= "- {$key}: {$value}\n";
            }
        }

        $prompt = "Viết mô tả sản phẩm hấp dẫn cho: \"{$productName}\".{$attrText}\n";
        $prompt .= "Yêu cầu:\n- Mô tả ngắn (50-80 từ) cho excerpt\n- Mô tả chi tiết (200-300 từ) cho trang sản phẩm\n- Highlight tính năng nổi bật\n- SEO-friendly\n- Format JSON: {\"excerpt\": \"...\", \"description\": \"...\", \"features\": [\"...\", \"...\"]}";

        return $this->generate($prompt, [
            'system' => 'Bạn là chuyên gia viết mô tả sản phẩm e-commerce. Trả lời bằng JSON valid.',
            'max_tokens' => 1500,
            'temperature' => 0.6,
        ]);
    }

    /**
     * Generate SEO meta tags for content.
     */
    public function generateSEO(string $title, string $content): array
    {
        $contentPreview = mb_substr(strip_tags($content), 0, 1000);

        $prompt = "Phân tích nội dung sau và tạo SEO metadata:\n\n";
        $prompt .= "Tiêu đề: {$title}\nNội dung: {$contentPreview}\n\n";
        $prompt .= "Trả lời JSON: {\"meta_title\": \"...(tối đa 60 ký tự)\", \"meta_description\": \"...(tối đa 160 ký tự)\", \"meta_keywords\": \"keyword1, keyword2, ....(tối đa 5 keywords)\", \"slug_suggestion\": \"...\"}";

        return $this->generate($prompt, [
            'system' => 'Bạn là chuyên gia SEO. Trả lời bằng JSON valid. Tối ưu cho Google search.',
            'max_tokens' => 500,
            'temperature' => 0.4,
        ]);
    }

    /**
     * Translate content to target language.
     */
    public function translate(string $content, string $targetLang, string $context = 'general'): array
    {
        $langMap = [
            'vi' => 'tiếng Việt', 'en' => 'English', 'ja' => 'Japanese',
            'ko' => 'Korean', 'zh' => 'Chinese (Simplified)',
        ];
        $targetName = $langMap[$targetLang] ?? $targetLang;
        $prompt = "Dịch nội dung sau sang {$targetName}.\nNgữ cảnh: {$context}\n\nNội dung:\n{$content}";

        return $this->generate($prompt, [
            'system' => "Bạn là dịch giả chuyên nghiệp. Dịch chính xác, tự nhiên, giữ nguyên format/markdown nếu có.",
            'max_tokens' => 3000,
            'temperature' => 0.3,
        ]);
    }

    /**
     * Suggest auto-categorization / tags for content.
     */
    public function suggestTags(string $content, array $existingCategories = []): array
    {
        $catList = !empty($existingCategories) ? implode(', ', $existingCategories) : 'tự do';
        $prompt = "Phân tích nội dung và gợi ý tags/danh mục.\n\nNội dung: " . mb_substr($content, 0, 500);
        $prompt .= "\n\nDanh mục hiện có: {$catList}";
        $prompt .= "\n\nTrả lời JSON: {\"tags\": [\"tag1\", \"tag2\", ...], \"categories\": [\"cat1\"], \"excerpt\": \"...(tóm tắt 1-2 câu)\"}";

        return $this->generate($prompt, [
            'system' => 'Bạn là chuyên gia content tagging. Trả lời bằng JSON valid.',
            'max_tokens' => 300,
            'temperature' => 0.3,
        ]);
    }

    // ───────── Private Methods ─────────

    /**
     * Estimate cost in USD based on token counts.
     */
    public function estimateCost(int $promptTokens, int $completionTokens): float
    {
        $prices = $this->pricing[$this->provider][$this->model] ?? ['input' => 0.15, 'output' => 0.60];
        $inputCost = ($promptTokens / 1_000_000) * $prices['input'];
        $outputCost = ($completionTokens / 1_000_000) * $prices['output'];
        return round($inputCost + $outputCost, 6);
    }

    protected function callOpenAI(string $system, string $prompt, int $maxTokens, float $temperature): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException("OpenAI API error: {$response->status()} - " . $response->body());
        }

        $data = $response->json();
        $usage = $data['usage'] ?? [];
        $promptTokens = $usage['prompt_tokens'] ?? 0;
        $completionTokens = $usage['completion_tokens'] ?? 0;

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'usage' => [
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'total_tokens' => $promptTokens + $completionTokens,
                'estimated_cost' => $this->estimateCost($promptTokens, $completionTokens),
            ],
        ];
    }

    protected function callAnthropic(string $system, string $prompt, int $maxTokens, float $temperature): array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'Content-Type' => 'application/json',
        ])->timeout(60)->post('https://api.anthropic.com/v1/messages', [
            'model' => $this->model,
            'system' => $system,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException("Anthropic API error: {$response->status()} - " . $response->body());
        }

        $data = $response->json();
        $usage = $data['usage'] ?? [];
        $promptTokens = $usage['input_tokens'] ?? 0;
        $completionTokens = $usage['output_tokens'] ?? 0;

        return [
            'content' => $data['content'][0]['text'] ?? '',
            'usage' => [
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'total_tokens' => $promptTokens + $completionTokens,
                'estimated_cost' => $this->estimateCost($promptTokens, $completionTokens),
            ],
        ];
    }

    protected function callGemini(string $system, string $prompt, int $maxTokens, float $temperature): array
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $body = [
            'system_instruction' => [
                'parts' => [['text' => $system]],
            ],
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => [
                'maxOutputTokens' => $maxTokens,
                'temperature' => $temperature,
            ],
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->timeout(60)->post($url, $body);

        if (!$response->successful()) {
            throw new \RuntimeException("Gemini API error: {$response->status()} - " . $response->body());
        }

        $data = $response->json();
        $usage = $data['usageMetadata'] ?? [];
        $promptTokens = $usage['promptTokenCount'] ?? 0;
        $completionTokens = $usage['candidatesTokenCount'] ?? 0;

        $content = '';
        if (!empty($data['candidates'][0]['content']['parts'])) {
            foreach ($data['candidates'][0]['content']['parts'] as $part) {
                $content .= $part['text'] ?? '';
            }
        }

        return [
            'content' => $content,
            'usage' => [
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'total_tokens' => $promptTokens + $completionTokens,
                'estimated_cost' => $this->estimateCost($promptTokens, $completionTokens),
            ],
        ];
    }
}
