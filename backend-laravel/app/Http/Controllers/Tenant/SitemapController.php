<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Repositories\Product\ProductRepositoryInterface;
use App\Repositories\Category\CategoryRepositoryInterface;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class SitemapController extends Controller
{
    public function __construct(
        private ProductRepositoryInterface $productRepo,
        private CategoryRepositoryInterface $categoryRepo,
    ) {}

    public function index()
    {
        $baseUrl = request()->getSchemeAndHttpHost();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Homepage
        $xml .= $this->urlTag($baseUrl . '/', now()->toW3cString(), 'daily', '1.0');

        // Products
        $products = $this->productRepo->query()
            ->where('is_active', true)
            ->select('id', 'slug', 'updated_at')
            ->orderByDesc('updated_at')
            ->limit(5000)
            ->get();

        foreach ($products as $product) {
            $xml .= $this->urlTag(
                $baseUrl . '/product/' . ($product->slug ?: $product->id),
                $product->updated_at?->toW3cString(),
                'weekly',
                '0.8'
            );
        }

        // Categories
        try {
            $categories = $this->categoryRepo->getCategories();
            foreach ($categories as $cat) {
                $xml .= $this->urlTag(
                    $baseUrl . '/products?category=' . ($cat->slug ?: $cat->id),
                    $cat->updated_at?->toW3cString() ?? now()->toW3cString(),
                    'weekly',
                    '0.7'
                );
            }
        } catch (\Exception $e) {
            // Skip if categories not available
        }

        // CMS Pages
        try {
            $pages = DB::table('cms_pages')
                ->select('alias', 'updated_at')
                ->orderByDesc('updated_at')
                ->get();
            foreach ($pages as $page) {
                $xml .= $this->urlTag(
                    $baseUrl . '/page/' . $page->alias,
                    $page->updated_at ?? now()->toW3cString(),
                    'monthly',
                    '0.6'
                );
            }
        } catch (\Exception $e) {
            // Skip if cms_pages not available
        }

        $xml .= '</urlset>';

        return new Response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
        ]);
    }

    private function urlTag(string $loc, ?string $lastmod, string $changefreq, string $priority): string
    {
        $tag = '<url>';
        $tag .= '<loc>' . htmlspecialchars($loc) . '</loc>';
        if ($lastmod) $tag .= '<lastmod>' . $lastmod . '</lastmod>';
        $tag .= '<changefreq>' . $changefreq . '</changefreq>';
        $tag .= '<priority>' . $priority . '</priority>';
        $tag .= '</url>';
        return $tag;
    }
}
