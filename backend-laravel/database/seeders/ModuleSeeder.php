<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Module;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'module_id' => 'warehouse',
                'name' => 'Quản lý Kho',
                'description' => 'Phiếu nhập kho, nhà cung cấp, Đơn Nhập Hàng, báo cáo tồn kho',
                'icon' => 'Package',
                'category' => 'operations',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Kho hàng',
                    'items' => [
                        ['key' => 'stock-receipts', 'label' => 'Phiếu kho', 'icon' => 'ClipboardList', 'route' => 'warehouse/stock-receipts'],
                        ['key' => 'suppliers', 'label' => 'Nhà cung cấp', 'icon' => 'Briefcase', 'route' => 'warehouse/suppliers'],
                        ['key' => 'purchase-orders', 'label' => 'Đơn Nhập Hàng', 'icon' => 'ShoppingCart', 'route' => 'warehouse/purchase-orders'],
                        ['key' => 'inventory-reports', 'label' => 'Báo cáo tồn kho', 'icon' => 'BarChart2', 'route' => 'warehouse/inventory-reports'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'accounting',
                'name' => 'Kế toán & Tài chính',
                'description' => 'Bảng kế toán, phiếu thu chi, hoá đơn, báo cáo doanh thu',
                'icon' => 'DollarSign',
                'category' => 'finance',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Bán hàng',
                    'items' => [
                        ['key' => 'accounting', 'label' => 'Kế toán', 'icon' => 'DollarSign', 'route' => 'orders/accounting'],
                        ['key' => 'payment-vouchers', 'label' => 'Thu/Chi', 'icon' => 'Wallet', 'route' => 'warehouse/payment-vouchers'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'marketing',
                'name' => 'Marketing & Khuyến mãi',
                'description' => 'Quản lý mã giảm giá, chương trình khuyến mãi, flash sale',
                'icon' => 'Tag',
                'category' => 'marketing',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Marketing',
                    'items' => [
                        ['key' => 'promotions', 'label' => 'Khuyến mãi', 'icon' => 'Tag', 'route' => 'shop/promotions'],
                        ['key' => 'flash-sales', 'label' => 'Flash Sale', 'icon' => 'Zap', 'route' => 'shop/flash-sales'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'tax',
                'name' => 'Quản lý Thuế',
                'description' => 'Cấu hình thuế VAT, tính thuế theo sản phẩm và khu vực',
                'icon' => 'Receipt',
                'category' => 'finance',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Bán hàng',
                    'items' => [
                        ['key' => 'tax', 'label' => 'Thuế', 'icon' => 'Receipt', 'route' => 'shop/tax'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'cms',
                'name' => 'Trang CMS',
                'description' => 'Tạo và quản lý trang nội dung tĩnh (About, FAQ, chính sách)',
                'icon' => 'BookOpen',
                'category' => 'content',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Giao diện',
                    'items' => [
                        ['key' => 'cms', 'label' => 'Trang CMS', 'icon' => 'BookOpen', 'route' => 'shop/cms'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'crm',
                'name' => 'CRM Khách hàng',
                'description' => 'Quản lý quan hệ khách hàng, phân loại, lịch sử mua hàng',
                'icon' => 'Users',
                'category' => 'sales',
                'version' => '1.0.0',
                'price' => 200000,
                'sidebar' => [
                    'group' => 'Bán hàng',
                    'items' => [
                        ['key' => 'crm', 'label' => 'CRM', 'icon' => 'Users', 'route' => 'shop/crm'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'newsletter',
                'name' => 'Email Marketing',
                'description' => 'Chiến dịch email, quản lý subscriber, template email',
                'icon' => 'Mail',
                'category' => 'marketing',
                'version' => '1.0.0',
                'price' => 150000,
                'sidebar' => [
                    'group' => 'Marketing',
                    'items' => [
                        ['key' => 'newsletter', 'label' => 'Email', 'icon' => 'Mail', 'route' => 'shop/newsletter'],
                    ],
                ],
                'requires' => ['marketing'],
            ],
            // ── New modules ──
            [
                'module_id' => 'shipping',
                'name' => 'Quản lý Vận chuyển',
                'description' => 'Cấu hình đối tác vận chuyển, phí ship, theo dõi đơn hàng',
                'icon' => 'Truck',
                'category' => 'operations',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Bán hàng',
                    'items' => [
                        ['key' => 'shipping', 'label' => 'Vận chuyển', 'icon' => 'Truck', 'route' => 'shop/shipping'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'banners',
                'name' => 'Quản lý Banner',
                'description' => 'Tạo và quản lý banner quảng cáo, slideshow trên storefront',
                'icon' => 'Image',
                'category' => 'content',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Giao diện',
                    'items' => [
                        ['key' => 'banners', 'label' => 'Banner', 'icon' => 'Image', 'route' => 'shop/banners'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'flash-sales',
                'name' => 'Flash Sale',
                'description' => 'Tạo chương trình giảm giá theo thời gian, đếm ngược, giới hạn số lượng',
                'icon' => 'Zap',
                'category' => 'marketing',
                'version' => '1.0.0',
                'price' => 100000,
                'sidebar' => [
                    'group' => 'Marketing',
                    'items' => [
                        ['key' => 'flash-sales', 'label' => 'Flash Sale', 'icon' => 'Zap', 'route' => 'shop/flash-sales'],
                    ],
                ],
                'requires' => ['marketing'],
            ],
            [
                'module_id' => 'activity-log',
                'name' => 'Nhật ký hoạt động',
                'description' => 'Theo dõi mọi thay đổi trong hệ thống, ai làm gì lúc nào',
                'icon' => 'ScrollText',
                'category' => 'operations',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Hệ thống',
                    'items' => [
                        ['key' => 'activity-log', 'label' => 'Nhật ký', 'icon' => 'ScrollText', 'route' => 'system/logs'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'api-integration',
                'name' => 'API & Webhooks',
                'description' => 'Quản lý API keys, webhooks để tích hợp hệ thống bên ngoài',
                'icon' => 'Webhook',
                'category' => 'operations',
                'version' => '1.0.0',
                'price' => 150000,
                'sidebar' => [
                    'group' => 'Hệ thống',
                    'items' => [
                        ['key' => 'api-keys', 'label' => 'API Keys', 'icon' => 'Key', 'route' => 'system/api-keys'],
                        ['key' => 'webhooks', 'label' => 'Webhooks', 'icon' => 'Webhook', 'route' => 'system/webhooks'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'custom-fields',
                'name' => 'Trường tùy chỉnh',
                'description' => 'Tạo trường dữ liệu mở rộng cho sản phẩm, đơn hàng, khách hàng',
                'icon' => 'FormInput',
                'category' => 'operations',
                'version' => '1.0.0',
                'price' => 100000,
                'sidebar' => [
                    'group' => 'Cửa hàng',
                    'items' => [
                        ['key' => 'custom-fields', 'label' => 'Trường tùy chỉnh', 'icon' => 'FormInput', 'route' => 'shop/custom-fields'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'languages',
                'name' => 'Đa ngôn ngữ',
                'description' => 'Dịch nội dung sản phẩm, trang, email sang nhiều ngôn ngữ',
                'icon' => 'Globe',
                'category' => 'content',
                'version' => '1.0.0',
                'price' => 200000,
                'sidebar' => [
                    'group' => 'Hệ thống',
                    'items' => [
                        ['key' => 'languages', 'label' => 'Ngôn ngữ', 'icon' => 'Globe', 'route' => 'shop/languages'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'lucky-draw',
                'name' => 'Vòng quay may mắn',
                'description' => 'Tạo mini-game vòng quay trúng thưởng cho khách hàng',
                'icon' => 'Dices',
                'category' => 'marketing',
                'version' => '1.0.0',
                'price' => 150000,
                'sidebar' => [
                    'group' => 'Marketing',
                    'items' => [
                        ['key' => 'lucky-draw', 'label' => 'Vòng quay', 'icon' => 'Dices', 'route' => 'shop/lucky-draw'],
                    ],
                ],
                'requires' => ['marketing'],
            ],
        ];

        foreach ($modules as $m) {
            Module::updateOrCreate(
                ['module_id' => $m['module_id']],
                $m
            );
        }
    }
}
