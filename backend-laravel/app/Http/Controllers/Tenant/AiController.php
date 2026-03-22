<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    /**
     * Generate generic content from a prompt.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string|max:5000',
            'type' => 'nullable|string|in:general,blog,product,seo,translate,tags,sales',
        ]);

        $ai = new AiService();
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
            default => $ai->generate($request->input('prompt'), [
                'max_tokens' => $request->input('max_tokens', 2000),
                'temperature' => $request->input('temperature', 0.7),
            ]),
        };

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
        $request->validate([
            'fields' => 'required|array|min:1',
            'fields.*.key' => 'required|string',
            'fields.*.value' => 'required|string',
            'target_lang' => 'required|string|max:5',
            'context' => 'nullable|string|max:50',
        ]);

        $ai = new AiService();
        $fields = $request->input('fields');
        $targetLang = $request->input('target_lang');
        $context = $request->input('context', 'e-commerce');

        // Combine fields into one prompt for efficiency
        $combined = collect($fields)->map(fn($f) => "[{$f['key']}]: {$f['value']}")->implode("\n---\n");

        $prompt = "Dịch các trường sau sang {$targetLang}. Giữ nguyên format [key]: value.\n\n{$combined}";

        $result = $ai->generate($prompt, [
            'system' => "Bạn là dịch giả chuyên nghiệp. Dịch chính xác từng trường, giữ nguyên key và format. Ngữ cảnh: {$context}.",
            'max_tokens' => 3000,
            'temperature' => 0.3,
        ]);

        return response()->json([
            'success' => $result['success'],
            'data' => $result,
        ], $result['success'] ? 200 : 500);
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

