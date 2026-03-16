<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class RobotsTxtController extends Controller
{
    public function index()
    {
        $baseUrl = request()->getSchemeAndHttpHost();

        $content = "User-agent: *\n";
        $content .= "Allow: /\n\n";
        $content .= "# Block admin/CMS paths\n";
        $content .= "Disallow: /api/\n";
        $content .= "Disallow: /login\n";
        $content .= "Disallow: /register\n";
        $content .= "Disallow: /admin/\n";
        $content .= "Disallow: /checkout/\n";
        $content .= "Disallow: /checkout\n";
        $content .= "Disallow: /cart\n";
        $content .= "Disallow: /account/\n";
        $content .= "Disallow: /account\n\n";
        $content .= "# Sitemap\n";
        $content .= "Sitemap: {$baseUrl}/api/storefront/sitemap.xml\n";

        return new Response($content, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }
}
