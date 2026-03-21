<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    use ApiResponse;

    /**
     * RSS 2.0 feed of published posts
     */
    public function rss(Request $request)
    {
        $posts = Content::ofType('post')
            ->published()
            ->orderBy('published_at', 'desc')
            ->limit(20)
            ->get();

        $shopName = config('app.name', 'Blog');
        $baseUrl = $request->getSchemeAndHttpHost();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n";
        $xml .= "<channel>\n";
        $xml .= "  <title>{$shopName} Blog</title>\n";
        $xml .= "  <link>{$baseUrl}/blog</link>\n";
        $xml .= "  <description>Latest posts from {$shopName}</description>\n";
        $xml .= "  <language>vi</language>\n";
        $xml .= "  <lastBuildDate>" . now()->toRfc2822String() . "</lastBuildDate>\n";

        foreach ($posts as $post) {
            $pubDate = ($post->published_at ?? $post->created_at)->toRfc2822String();
            $excerpt = htmlspecialchars(strip_tags($post->excerpt ?? mb_substr($post->body, 0, 160)));
            $title = htmlspecialchars($post->title);

            $xml .= "  <item>\n";
            $xml .= "    <title>{$title}</title>\n";
            $xml .= "    <link>{$baseUrl}/blog/{$post->slug}</link>\n";
            $xml .= "    <description>{$excerpt}</description>\n";
            $xml .= "    <pubDate>{$pubDate}</pubDate>\n";
            $xml .= "    <guid>{$baseUrl}/blog/{$post->slug}</guid>\n";
            $xml .= "  </item>\n";
        }

        $xml .= "</channel>\n</rss>";

        return response($xml, 200, [
            'Content-Type' => 'application/rss+xml; charset=UTF-8',
        ]);
    }

    /**
     * Public: list published posts for storefront
     */
    public function posts(Request $request)
    {
        $query = Content::ofType('post')
            ->published()
            ->with('taxonomies')
            ->orderBy('published_at', 'desc');

        // Category filter
        if ($category = $request->input('category')) {
            $query->whereHas('taxonomies', function ($q) use ($category) {
                $q->where('taxonomy', 'category')->where('term', $category);
            });
        }

        // Tag filter
        if ($tag = $request->input('tag')) {
            $query->whereHas('taxonomies', function ($q) use ($tag) {
                $q->where('taxonomy', 'tag')->where('term', $tag);
            });
        }

        // Search
        if ($search = $request->input('search')) {
            $query->where('title', 'ilike', "%{$search}%");
        }

        $perPage = min($request->input('per_page', 12), 50);
        return $this->successResponse($query->paginate($perPage));
    }

    /**
     * Public: show a single post by slug
     */
    public function showBySlug(string $slug)
    {
        $post = Content::ofType('post')
            ->published()
            ->with('taxonomies')
            ->where('slug', $slug)
            ->first();

        if (!$post) {
            return $this->notFoundResponse('Bài viết không tồn tại');
        }

        return $this->successResponse($post);
    }
}
