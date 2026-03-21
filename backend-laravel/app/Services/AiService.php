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
 */
class AiService
{
    protected string $provider;
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->provider = config('services.ai.provider', 'openai');
        $this->apiKey = config("services.ai.{$this->provider}.key", '');
        $this->model = config("services.ai.{$this->provider}.model", 'gpt-4o-mini');
    }

    /**
     * Generate content based on a prompt.
     */
    public function generate(string $prompt, array $options = []): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'error' => 'AI API key chưa được cấu hình. Vui lòng cấu hình trong Cài đặt → AI.',
            ];
        }

        $maxTokens = $options['max_tokens'] ?? 2000;
        $temperature = $options['temperature'] ?? 0.7;
        $systemPrompt = $options['system'] ?? 'Bạn là trợ lý viết nội dung chuyên nghiệp. Trả lời bằng tiếng Việt.';

        try {
            $result = match ($this->provider) {
                'openai' => $this->callOpenAI($systemPrompt, $prompt, $maxTokens, $temperature),
                'anthropic' => $this->callAnthropic($systemPrompt, $prompt, $maxTokens, $temperature),
                default => throw new \RuntimeException("Provider không hỗ trợ: {$this->provider}"),
            };

            return ['success' => true, 'content' => $result, 'provider' => $this->provider, 'model' => $this->model];
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
        if ($outline) {
            $prompt .= "Dàn ý:\n{$outline}\n";
        }
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
            'vi' => 'tiếng Việt',
            'en' => 'English',
            'ja' => 'Japanese',
            'ko' => 'Korean',
            'zh' => 'Chinese (Simplified)',
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

    protected function callOpenAI(string $system, string $prompt, int $maxTokens, float $temperature): string
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

        return $response->json('choices.0.message.content', '');
    }

    protected function callAnthropic(string $system, string $prompt, int $maxTokens, float $temperature): string
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

        return $response->json('content.0.text', '');
    }
}
