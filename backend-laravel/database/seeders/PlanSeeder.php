<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Miễn phí',
                'slug' => 'free',
                'price' => 0,
                'billing_cycle' => 'monthly',
                'sort_order' => 1,
                'is_active' => true,
                'limits' => [
                    'sites' => 1,
                    'pages' => 5,
                    'storage_mb' => 200,
                    'api_requests_per_hour' => 100,
                    'modules_free' => 3,
                    'modules_paid' => 0,
                    'custom_domains' => 0,
                    'users' => 1,
                    'headless_mode' => false,
                ],
                'features' => ['cms', 'basic_seo'],
            ],
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'price' => 199000,
                'billing_cycle' => 'monthly',
                'sort_order' => 2,
                'is_active' => true,
                'limits' => [
                    'sites' => 1,
                    'pages' => 20,
                    'storage_mb' => 1000,
                    'api_requests_per_hour' => 500,
                    'modules_free' => 5,
                    'modules_paid' => 2,
                    'custom_domains' => 1,
                    'users' => 3,
                    'headless_mode' => false,
                ],
                'features' => ['cms', 'seo', 'ecom', 'crm'],
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'price' => 499000,
                'billing_cycle' => 'monthly',
                'sort_order' => 3,
                'is_active' => true,
                'limits' => [
                    'sites' => 3,
                    'pages' => 100,
                    'storage_mb' => 5000,
                    'api_requests_per_hour' => 2000,
                    'modules_free' => 10,
                    'modules_paid' => 5,
                    'custom_domains' => 3,
                    'users' => 10,
                    'headless_mode' => true,
                ],
                'features' => ['cms', 'seo', 'ecom', 'crm', 'api', 'analytics', 'headless'],
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'price' => 1499000,
                'billing_cycle' => 'monthly',
                'sort_order' => 4,
                'is_active' => true,
                'limits' => [
                    'sites' => 10,
                    'pages' => -1, // unlimited
                    'storage_mb' => 50000,
                    'api_requests_per_hour' => 10000,
                    'modules_free' => -1, // unlimited
                    'modules_paid' => -1, // unlimited
                    'custom_domains' => 10,
                    'users' => 50,
                    'headless_mode' => true,
                ],
                'features' => ['all'],
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }

        $this->command?->info('✅ Plans seeded: ' . count($plans) . ' plans');
    }
}
