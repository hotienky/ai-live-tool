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
                'module_id' => 'ecom',
                'name' => 'E-commerce Core',
                'description' => 'Sản phẩm, đơn hàng, khách hàng, thanh toán — nền tảng bán hàng',
                'icon' => 'Store',
                'category' => 'core',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Cửa hàng',
                    'items' => [
                        ['key' => 'products', 'label' => 'Sản phẩm', 'icon' => 'ShoppingBag', 'route' => 'shop/products'],
                        ['key' => 'categories', 'label' => 'Danh mục', 'icon' => 'FolderTree', 'route' => 'shop/categories'],
                        ['key' => 'brands', 'label' => 'Thương hiệu', 'icon' => 'Award', 'route' => 'shop/brands'],
                        ['key' => 'orders', 'label' => 'Đơn hàng', 'icon' => 'Receipt', 'route' => 'orders'],
                        ['key' => 'customers', 'label' => 'Khách hàng', 'icon' => 'Users', 'route' => 'orders/customers'],
                    ],
                ],
                'requires' => [],
            ],
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
            [
                'module_id' => 'livestream',
                'name' => 'Live Comment Reader',
                'description' => 'Đọc bình luận TikTok, Facebook, YouTube, Shopee livestream theo thời gian thực. Phân loại lead HOT/WARM/COLD, xem lại phiên, báo cáo.',
                'icon' => 'MonitorPlay',
                'category' => 'live',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Live',
                    'items' => [
                        ['key' => 'live', 'label' => 'Live Monitor', 'icon' => 'MonitorPlay', 'route' => 'live'],
                        ['key' => 'live-replay', 'label' => 'Session Replay', 'icon' => 'PlayCircle', 'route' => 'live/replay'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'blog',
                'name' => 'Blog & Bài viết',
                'description' => 'Viết blog, quản lý bài viết, danh mục, bình luận, RSS feed',
                'icon' => 'PenSquare',
                'category' => 'content',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Blog',
                    'items' => [
                        ['key' => 'blog-posts', 'label' => 'Bài viết', 'icon' => 'FileText', 'route' => 'blog/posts'],
                        ['key' => 'blog-categories', 'label' => 'Danh mục', 'icon' => 'FolderOpen', 'route' => 'blog/categories'],
                        ['key' => 'blog-comments', 'label' => 'Bình luận', 'icon' => 'MessageCircle', 'route' => 'blog/comments'],
                        ['key' => 'blog-settings', 'label' => 'Cài đặt', 'icon' => 'Settings', 'route' => 'blog/settings'],
                    ],
                ],
                'requires' => [],
            ],
            // ── Education ──
            [
                'module_id' => 'lms',
                'name' => 'Khóa học trực tuyến (LMS)',
                'description' => 'Tạo khóa học, bài giảng, bài kiểm tra, chứng chỉ, theo dõi tiến trình học viên',
                'icon' => 'GraduationCap',
                'category' => 'education',
                'version' => '1.0.0',
                'price' => 300000,
                'sidebar' => [
                    'group' => 'Khóa học',
                    'items' => [
                        ['key' => 'lms-courses', 'label' => 'Khóa học', 'icon' => 'BookOpen', 'route' => 'lms/courses'],
                        ['key' => 'lms-students', 'label' => 'Học viên', 'icon' => 'Users', 'route' => 'lms/students'],
                        ['key' => 'lms-certificates', 'label' => 'Chứng chỉ', 'icon' => 'Award', 'route' => 'lms/certificates'],
                    ],
                ],
                'requires' => [],
            ],
            // ── Booking & Services ──
            [
                'module_id' => 'booking',
                'name' => 'Đặt lịch & Dịch vụ',
                'description' => 'Quản lý dịch vụ, lịch hẹn, đặt chỗ, nhắc nhở tự động',
                'icon' => 'CalendarCheck',
                'category' => 'booking',
                'version' => '1.0.0',
                'price' => 250000,
                'sidebar' => [
                    'group' => 'Đặt lịch',
                    'items' => [
                        ['key' => 'booking-services', 'label' => 'Dịch vụ', 'icon' => 'Briefcase', 'route' => 'booking/services'],
                        ['key' => 'booking-appointments', 'label' => 'Lịch hẹn', 'icon' => 'CalendarDays', 'route' => 'booking/appointments'],
                        ['key' => 'booking-calendar', 'label' => 'Lịch', 'icon' => 'Calendar', 'route' => 'booking/calendar'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'events',
                'name' => 'Quản lý Sự kiện',
                'description' => 'Tạo sự kiện, bán vé, RSVP, quản lý khách tham dự',
                'icon' => 'CalendarPlus',
                'category' => 'booking',
                'version' => '1.0.0',
                'price' => 200000,
                'sidebar' => [
                    'group' => 'Sự kiện',
                    'items' => [
                        ['key' => 'events-list', 'label' => 'Sự kiện', 'icon' => 'CalendarPlus', 'route' => 'events/list'],
                        ['key' => 'events-tickets', 'label' => 'Vé', 'icon' => 'Ticket', 'route' => 'events/tickets'],
                    ],
                ],
                'requires' => [],
            ],
            // ── Community ──
            [
                'module_id' => 'forum',
                'name' => 'Diễn đàn cộng đồng',
                'description' => 'Tạo diễn đàn thảo luận, chủ đề, trả lời, quản lý nội dung',
                'icon' => 'MessagesSquare',
                'category' => 'community',
                'version' => '1.0.0',
                'price' => 200000,
                'sidebar' => [
                    'group' => 'Cộng đồng',
                    'items' => [
                        ['key' => 'forum-threads', 'label' => 'Chủ đề', 'icon' => 'MessageCircle', 'route' => 'forum/threads'],
                        ['key' => 'forum-moderation', 'label' => 'Kiểm duyệt', 'icon' => 'Shield', 'route' => 'forum/moderation'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'membership',
                'name' => 'Hội viên & Thành viên',
                'description' => 'Quản lý hội viên, phân cấp thành viên, nội dung dành riêng',
                'icon' => 'UserCheck',
                'category' => 'community',
                'version' => '1.0.0',
                'price' => 250000,
                'sidebar' => [
                    'group' => 'Cộng đồng',
                    'items' => [
                        ['key' => 'membership-tiers', 'label' => 'Cấp thành viên', 'icon' => 'Crown', 'route' => 'membership/tiers'],
                        ['key' => 'membership-members', 'label' => 'Thành viên', 'icon' => 'Users', 'route' => 'membership/members'],
                    ],
                ],
                'requires' => [],
            ],
            // ── Directory ──
            [
                'module_id' => 'jobboard',
                'name' => 'Bảng Tuyển dụng',
                'description' => 'Đăng tuyển, quản lý hồ sơ, ứng viên, quy trình tuyển dụng',
                'icon' => 'Briefcase',
                'category' => 'directory',
                'version' => '1.0.0',
                'price' => 250000,
                'sidebar' => [
                    'group' => 'Tuyển dụng',
                    'items' => [
                        ['key' => 'jobs', 'label' => 'Tin tuyển dụng', 'icon' => 'Briefcase', 'route' => 'jobs/listings'],
                        ['key' => 'applicants', 'label' => 'Ứng viên', 'icon' => 'UserPlus', 'route' => 'jobs/applicants'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'realestate',
                'name' => 'Bất động sản',
                'description' => 'Quản lý tin đăng bất động sản, tìm kiếm, bản đồ, hồ sơ môi giới',
                'icon' => 'Home',
                'category' => 'directory',
                'version' => '1.0.0',
                'price' => 300000,
                'sidebar' => [
                    'group' => 'Bất động sản',
                    'items' => [
                        ['key' => 'property-listings', 'label' => 'Tin đăng', 'icon' => 'Home', 'route' => 'realestate/listings'],
                        ['key' => 'property-agents', 'label' => 'Môi giới', 'icon' => 'UserCircle', 'route' => 'realestate/agents'],
                    ],
                ],
                'requires' => [],
            ],
            // ── Industry ──
            [
                'module_id' => 'restaurant',
                'name' => 'Nhà hàng & F&B',
                'description' => 'Menu, đặt bàn, đặt món online, QR menu, quản lý bếp',
                'icon' => 'UtensilsCrossed',
                'category' => 'industry',
                'version' => '1.0.0',
                'price' => 300000,
                'sidebar' => [
                    'group' => 'Nhà hàng',
                    'items' => [
                        ['key' => 'restaurant-menu', 'label' => 'Menu', 'icon' => 'BookOpen', 'route' => 'restaurant/menu'],
                        ['key' => 'restaurant-tables', 'label' => 'Đặt bàn', 'icon' => 'Armchair', 'route' => 'restaurant/tables'],
                        ['key' => 'restaurant-orders', 'label' => 'Đơn hàng', 'icon' => 'ClipboardList', 'route' => 'restaurant/orders'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'salon',
                'name' => 'Salon & Spa',
                'description' => 'Dịch vụ, đặt lịch, nhân viên, khách hàng, báo cáo doanh thu',
                'icon' => 'Scissors',
                'category' => 'industry',
                'version' => '1.0.0',
                'price' => 250000,
                'sidebar' => [
                    'group' => 'Salon',
                    'items' => [
                        ['key' => 'salon-services', 'label' => 'Dịch vụ', 'icon' => 'Sparkles', 'route' => 'salon/services'],
                        ['key' => 'salon-staff', 'label' => 'Nhân viên', 'icon' => 'Users', 'route' => 'salon/staff'],
                        ['key' => 'salon-bookings', 'label' => 'Lịch hẹn', 'icon' => 'CalendarCheck', 'route' => 'salon/bookings'],
                    ],
                ],
                'requires' => ['booking'],
            ],
            // ── Utilities ──
            [
                'module_id' => 'seo',
                'name' => 'SEO & Tối ưu tìm kiếm',
                'description' => 'Sitemap, meta tags, schema markup, phân tích SEO trang',
                'icon' => 'Search',
                'category' => 'utilities',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Hệ thống',
                    'items' => [
                        ['key' => 'seo-settings', 'label' => 'SEO', 'icon' => 'Search', 'route' => 'system/seo'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'analytics',
                'name' => 'Phân tích & Thống kê',
                'description' => 'Thống kê truy cập, hành vi người dùng, conversion tracking',
                'icon' => 'BarChart3',
                'category' => 'utilities',
                'version' => '1.0.0',
                'price' => 150000,
                'sidebar' => [
                    'group' => 'Báo cáo',
                    'items' => [
                        ['key' => 'analytics-dashboard', 'label' => 'Thống kê', 'icon' => 'BarChart3', 'route' => 'analytics/dashboard'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'reviews',
                'name' => 'Đánh giá & Nhận xét',
                'description' => 'Đánh giá sao, nhận xét sản phẩm, kiểm duyệt, hiển thị trên storefront',
                'icon' => 'Star',
                'category' => 'utilities',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Cửa hàng',
                    'items' => [
                        ['key' => 'reviews', 'label' => 'Đánh giá', 'icon' => 'Star', 'route' => 'shop/reviews'],
                    ],
                ],
                'requires' => ['ecom'],
            ],
            [
                'module_id' => 'forms',
                'name' => 'Form Builder',
                'description' => 'Tạo form liên hệ, đăng ký, khảo sát, thu thập dữ liệu',
                'icon' => 'ClipboardEdit',
                'category' => 'utilities',
                'version' => '1.0.0',
                'price' => 0,
                'sidebar' => [
                    'group' => 'Nội dung',
                    'items' => [
                        ['key' => 'forms', 'label' => 'Forms', 'icon' => 'ClipboardEdit', 'route' => 'forms/list'],
                        ['key' => 'form-submissions', 'label' => 'Phản hồi', 'icon' => 'Inbox', 'route' => 'forms/submissions'],
                    ],
                ],
                'requires' => [],
            ],
            [
                'module_id' => 'ai-assistant',
                'name' => 'AI Trợ lý viết nội dung',
                'description' => 'Tạo nội dung tự động, viết mô tả sản phẩm, gợi ý SEO bằng AI',
                'icon' => 'Sparkles',
                'category' => 'utilities',
                'version' => '1.0.0',
                'price' => 300000,
                'sidebar' => [
                    'group' => 'Công cụ',
                    'items' => [
                        ['key' => 'ai-writer', 'label' => 'AI Writer', 'icon' => 'Sparkles', 'route' => 'tools/ai-writer'],
                    ],
                ],
                'requires' => [],
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
