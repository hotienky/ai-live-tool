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
            'type' => 'nullable|string|in:general,blog,product,seo,translate,tags',
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
}
