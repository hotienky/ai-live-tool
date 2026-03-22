<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Restrict origins in production via CORS_ALLOWED_ORIGINS env
    // Format: comma-separated list, e.g. "https://admin.example.com,https://shop.example.com"
    'allowed_origins' => array_filter(
        array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '*')))
    ),

    'allowed_origins_patterns' => [
        // Allow all tenant subdomains
        env('CORS_SUBDOMAIN_PATTERN', ''),
    ],

    'allowed_headers' => [
        'Content-Type', 'Authorization', 'X-Requested-With',
        'Accept', 'Origin', 'X-Api-Key', 'X-Tenant-Slug',
    ],

    'exposed_headers' => [
        'X-Total-Count', 'X-Per-Page', 'X-Current-Page', 'X-Last-Page',
    ],

    // Preflight cache: 2 hours (reduces OPTIONS requests)
    'max_age' => 7200,

    'supports_credentials' => true,
];
