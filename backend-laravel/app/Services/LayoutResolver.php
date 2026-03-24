<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Server-side data resolver for layout nodes (BFF pattern).
 * Recursively resolves `data.endpoint` fields in layout JSON,
 * so the frontend receives pre-fetched data without N+1 API calls.
 */
class LayoutResolver
{
    private string $baseUrl;

    public function __construct()
    {
        // Internal API base for tenant data fetching
        $this->baseUrl = rtrim(config('app.url'), '/');
    }

    /**
     * Resolve all data sources in a layout array.
     */
    public function resolve(array $nodes, ?string $locale = null): array
    {
        return array_map(fn($node) => $this->resolveNode($node, $locale), $nodes);
    }

    /**
     * Resolve a single node: fetch its data source and process children.
     */
    private function resolveNode(array $node, ?string $locale = null): array
    {
        // Resolve data source if present
        if (!empty($node['data']['endpoint'])) {
            try {
                $node['props'] = $node['props'] ?? [];
                $node['props']['resolvedData'] = $this->fetchData(
                    $node['data']['endpoint'],
                    $node['data']['params'] ?? [],
                    $locale
                );
            } catch (\Exception $e) {
                Log::warning("LayoutResolver: Failed to resolve {$node['data']['endpoint']}", [
                    'error' => $e->getMessage(),
                ]);
                $node['props']['resolvedData'] = [];
            }
        }

        // Recursively resolve children
        if (!empty($node['children'])) {
            $node['children'] = array_map(
                fn($child) => $this->resolveNode($child, $locale),
                $node['children']
            );
        }

        return $node;
    }

    /**
     * Fetch data from an internal endpoint.
     */
    private function fetchData(string $endpoint, array $params = [], ?string $locale = null): mixed
    {
        // Map common endpoints to direct repository calls (avoid HTTP overhead)
        $dataMap = $this->getDirectDataMap();

        $cleanEndpoint = ltrim($endpoint, '/');
        if (isset($dataMap[$cleanEndpoint])) {
            return call_user_func($dataMap[$cleanEndpoint], $params, $locale);
        }

        // Fallback: internal HTTP call
        $url = $this->baseUrl . '/' . $cleanEndpoint;
        $query = $params;
        if ($locale) {
            $query['lang'] = $locale;
        }

        $response = Http::timeout(5)->get($url, $query);
        if ($response->successful()) {
            $body = $response->json();
            return $body['data'] ?? $body;
        }

        return [];
    }

    /**
     * Direct data map for common endpoints (avoids HTTP round-trip).
     */
    private function getDirectDataMap(): array
    {
        return [
            'api/storefront/banners' => function ($params, $locale) {
                $repo = app(\App\Repositories\Banner\BannerRepositoryInterface::class);
                return collect($repo->manyBy('status', true))->map(fn($b) => $b->toArray())->values()->all();
            },
            'api/storefront/products' => function ($params, $locale) {
                $repo = app(\App\Repositories\Product\ProductRepositoryInterface::class);
                $perPage = $params['limit'] ?? 12;
                return collect($repo->getProducts($perPage)->items())->map(fn($p) => $p->toArray())->all();
            },
        ];
    }
}
