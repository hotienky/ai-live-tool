<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        /*
         * Firebase / Google Cloud Storage
         * Uses S3-compatible interoperability API.
         * Docs: https://cloud.google.com/storage/docs/interoperability
         */
        'firebase' => [
            'driver' => 's3',
            'key' => env('FIREBASE_STORAGE_KEY'),
            'secret' => env('FIREBASE_STORAGE_SECRET'),
            'region' => env('FIREBASE_STORAGE_REGION', 'us-central1'),
            'bucket' => env('FIREBASE_STORAGE_BUCKET'),
            'url' => env('FIREBASE_STORAGE_URL'),
            'endpoint' => env('FIREBASE_STORAGE_ENDPOINT', 'https://storage.googleapis.com'),
            'use_path_style_endpoint' => true,
            'throw' => false,
            'report' => false,
        ],

        /*
         * VNG vStorage (S3-compatible Object Storage)
         * Docs: https://docs.vngcloud.vn/vng-cloud-document/vn/vstorage
         */
        'vstorage' => [
            'driver' => 's3',
            'key' => env('VSTORAGE_ACCESS_KEY'),
            'secret' => env('VSTORAGE_SECRET_KEY'),
            'region' => env('VSTORAGE_REGION', 'HCM03'),
            'bucket' => env('VSTORAGE_BUCKET'),
            'url' => env('VSTORAGE_URL'),
            'endpoint' => env('VSTORAGE_ENDPOINT', 'https://hcm03.vstorage.vngcloud.vn'),
            'use_path_style_endpoint' => true,
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
