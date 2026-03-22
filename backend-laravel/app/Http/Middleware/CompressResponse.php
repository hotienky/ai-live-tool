<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Compress JSON API responses with gzip.
 * Reduces response size by 60-80% for typical JSON payloads.
 *
 * Usage: Route::middleware('compress') or apply globally.
 */
class CompressResponse
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only compress if client accepts gzip
        if (!str_contains($request->header('Accept-Encoding', ''), 'gzip')) {
            return $response;
        }

        // Only compress JSON and HTML responses
        $contentType = $response->headers->get('Content-Type', '');
        if (!str_contains($contentType, 'json') && !str_contains($contentType, 'html')) {
            return $response;
        }

        // Skip if already encoded or response is too small (<1KB)
        if ($response->headers->has('Content-Encoding')) {
            return $response;
        }

        $content = $response->getContent();
        if (strlen($content) < 1024) {
            return $response;
        }

        $compressed = gzencode($content, 6);
        if ($compressed === false) {
            return $response;
        }

        $response->setContent($compressed);
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Content-Length', strlen($compressed));
        $response->headers->set('Vary', 'Accept-Encoding');

        return $response;
    }
}
