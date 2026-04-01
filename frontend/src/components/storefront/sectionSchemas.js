/**
 * P4 – Plugin Architecture: Section schemas organized by module.
 * Each section declares its `moduleId` for UI grouping and module gating.
 *
 * sectionMeta: type → { label, moduleId, category, icon, description }
 * sectionSchemas: type → field definitions for the config panel
 */

// ══════════════════════════════════════════
// Section Metadata — used by "Add Section" panel
// Groups sections by module for intuitive UX
// ══════════════════════════════════════════
export const sectionMeta = {
  // ── Core sections (always available) ──
  banner:        { label: 'Banner / Slider',     moduleId: null, category: 'Cơ bản',       icon: 'Image', description: 'Slideshow ảnh quảng cáo' },
  image_banner:  { label: 'Promo Banner',        moduleId: null, category: 'Cơ bản',       icon: 'Tag', description: 'Banner ảnh đơn (FullWidth)' },
  feature_links: { label: 'Tính năng nhanh',     moduleId: null, category: 'Cơ bản',       icon: 'Zap', description: 'Các thẻ chức năng nổi bật' },
  cms_pages:     { label: 'Trang CMS',           moduleId: 'cms', category: 'Cơ bản',      icon: 'FileText', description: 'Hiển thị danh sách trang' },
  text_block:    { label: 'Khối văn bản',        moduleId: null, category: 'Cơ bản',       icon: 'Type', description: 'Đoạn text tùy chỉnh' },
  image_gallery: { label: 'Bộ sưu tập ảnh',     moduleId: null, category: 'Cơ bản',       icon: 'Images', description: 'Gallery hình ảnh' },
  video_embed:   { label: 'Video nhúng',         moduleId: null, category: 'Cơ bản',       icon: 'Film', description: 'YouTube/Vimeo embed' },
  testimonials:  { label: 'Đánh giá khách hàng', moduleId: null, category: 'Cơ bản',       icon: 'Star', description: 'Testimonials / Reviews' },
  faq:           { label: 'Câu hỏi thường gặp', moduleId: null, category: 'Cơ bản',       icon: 'HelpCircle', description: 'FAQ accordion' },
  newsletter:    { label: 'Đăng ký nhận tin',    moduleId: null, category: 'Cơ bản',       icon: 'Mail', description: 'Form đăng ký email' },
  form:          { label: 'Biểu mẫu (Form)',     moduleId: 'forms',category: 'Cơ bản',     icon: 'MousePointerClick', description: 'Biểu mẫu tương tác' },
  social_feed:   { label: 'Mạng xã hội',        moduleId: null, category: 'Cơ bản',       icon: 'Share2', description: 'Links social media' },
  trust_badges:  { label: 'Trust Badges',        moduleId: null, category: 'Cơ bản',       icon: 'ShieldCheck', description: 'Huy hiệu uy tín' },
  brands_slider: { label: 'Thương hiệu',        moduleId: null, category: 'Cơ bản',       icon: 'Award', description: 'Slide logo đối tác' },

  // ── Layout / Structure ──
  grid:          { label: 'Lưới bố cục',         moduleId: null, category: 'Bố cục',       icon: 'LayoutGrid', description: 'Layout grid nhiều cột' },
  custom_block:  { label: 'Visual Block',        moduleId: null, category: 'Bố cục',       icon: 'Box', description: 'Block builder nâng cao' },

  // ── E-Commerce (requires 'ecom' module) ──
  categories:        { label: 'Danh mục SP',         moduleId: 'ecom', category: 'E-Commerce', icon: 'FolderOpen', description: 'Hiển thị danh mục sản phẩm' },
  featured_products: { label: 'Sản phẩm nổi bật',    moduleId: 'ecom', category: 'E-Commerce', icon: 'ShoppingBag', description: 'Grid sản phẩm nổi bật' },
  new_arrivals:      { label: 'Hàng mới về',         moduleId: 'ecom', category: 'E-Commerce', icon: 'Sparkles', description: 'Sản phẩm mới nhất' },
  flash_sale:        { label: 'Flash Sale',           moduleId: 'ecom', category: 'E-Commerce', icon: 'Zap', description: 'Đếm ngược giảm giá' },

  // ── Blog (requires 'blog' module) ──
  blog_posts:        { label: 'Bài viết gần đây',    moduleId: 'blog', category: 'Blog',       icon: 'FileEdit', description: 'Danh sách bài viết mới' },

  // ── Restaurant (requires 'restaurant' module) ──
  restaurant_menu:   { label: 'Thực đơn',            moduleId: 'restaurant', category: 'Nhà hàng', icon: 'UtensilsCrossed', description: 'Hiển thị thực đơn' },

  // ── Booking (requires 'booking' module) ──
  booking_services:  { label: 'Dịch vụ đặt lịch',    moduleId: 'booking', category: 'Đặt lịch',   icon: 'CalendarDays', description: 'Danh sách dịch vụ đặt lịch' },

  // ── Salon (requires 'salon' module) ──
  salon_services:    { label: 'Dịch vụ Spa/Salon',   moduleId: 'salon', category: 'Spa & Salon', icon: 'Flower2', description: 'Danh sách dịch vụ spa' },

  // ── Real Estate (requires 'realestate' module) ──
  property_listings: { label: 'Bất động sản',        moduleId: 'realestate', category: 'BĐS',    icon: 'Building2', description: 'Tin đăng BĐS mới nhất' },

  // ── Events (requires 'events' module) ──
  upcoming_events:   { label: 'Sự kiện sắp tới',     moduleId: 'events', category: 'Sự kiện',    icon: 'PartyPopper', description: 'Danh sách sự kiện' },

  // ── System Page Sections (dynamic page composition) ──
  page_breadcrumb:     { label: 'Breadcrumb',           moduleId: null, category: 'Hệ thống', icon: 'ChevronRight', description: 'Thanh điều hướng breadcrumb' },
  page_heading:        { label: 'Tiêu đề trang',        moduleId: null, category: 'Hệ thống', icon: 'Type',         description: 'Heading + mô tả trang' },
  product_grid:        { label: 'Lưới sản phẩm',        moduleId: 'ecom', category: 'Hệ thống', icon: 'LayoutGrid',  description: 'Danh sách SP có filter/sidebar' },
  product_detail_view: { label: 'Chi tiết sản phẩm',    moduleId: 'ecom', category: 'Hệ thống', icon: 'Package',     description: 'Gallery + thông tin SP' },
  product_reviews:     { label: 'Đánh giá sản phẩm',    moduleId: 'ecom', category: 'Hệ thống', icon: 'Star',        description: 'Danh sách đánh giá SP' },
  related_products:    { label: 'SP liên quan',          moduleId: 'ecom', category: 'Hệ thống', icon: 'ShoppingBag', description: 'Sản phẩm liên quan' },
  cart_summary:        { label: 'Giỏ hàng',              moduleId: 'ecom', category: 'Hệ thống', icon: 'ShoppingCart', description: 'Nội dung giỏ hàng' },
  checkout_form:       { label: 'Form thanh toán',       moduleId: 'ecom', category: 'Hệ thống', icon: 'CreditCard',  description: 'Form checkout' },
  auth_form:           { label: 'Đăng nhập/Đăng ký',    moduleId: null, category: 'Hệ thống', icon: 'Lock',        description: 'Form xác thực' },
  account_dashboard:   { label: 'Dashboard tài khoản',   moduleId: null, category: 'Hệ thống', icon: 'User',        description: 'Trang tài khoản' },
  order_history:       { label: 'Lịch sử đơn hàng',     moduleId: 'ecom', category: 'Hệ thống', icon: 'FileStack',   description: 'Danh sách đơn hàng' },
  blog_listing:        { label: 'Danh sách bài viết',    moduleId: 'blog', category: 'Hệ thống', icon: 'BookOpen',    description: 'Trang blog listing' },
  wishlist_grid:       { label: 'Danh sách yêu thích',   moduleId: 'ecom', category: 'Hệ thống', icon: 'Heart',       description: 'Sản phẩm yêu thích' },
}


// ══════════════════════════════════════════
// Section Config Schemas — used by config panel
// ══════════════════════════════════════════
export const sectionSchemas = {
  banner: [
    { key: 'autoplay', type: 'boolean', label: 'Tự chuyển (Autoplay)' },
    { key: 'interval', type: 'number', label: 'Tốc độ (ms)', condition: 'autoplay', min: 1000, max: 10000, step: 500 },
    { key: 'height', type: 'select', label: 'Chiều cao', options: [{value: 'sm', label: 'Nhỏ'}, {value: 'md', label: 'Vừa'}, {value: 'lg', label: 'Lớn'}] },
    { key: '_content', type: 'list', label: 'Danh sách Slide', fields: [
      { key: 'image', type: 'media', placeholder: 'URL ảnh nền (Desktop / Đa năng)' },
      { key: 'title', type: 'text', placeholder: 'Tiêu đề slide' },
      { key: 'description', type: 'textarea', placeholder: 'Mô tả ngắn' },
      { key: 'url', type: 'url', placeholder: 'Đường dẫn đích (link)' }
    ]}
  ],
  image_banner: [
    { key: 'desktopImage', type: 'media', label: 'Ảnh Desktop' },
    { key: 'mobileImage', type: 'media', label: 'Ảnh Mobile (Tùy chọn)' },
    { key: 'link', type: 'url', label: 'Đường dẫn (Link)' },
    { key: 'fullWidth', type: 'boolean', label: 'Rộng toàn màn hình' },
    { key: 'height', type: 'text', label: 'Chiều cao (VD: 400px, 50vh)', placeholder: 'auto' },
    { key: 'altText', type: 'text', label: 'Alt text (SEO)' },
    { key: 'overlay', type: 'boolean', label: 'Lớp phủ tối' },
    { key: 'overlayOpacity', type: 'range', label: 'Độ mờ overlay', condition: 'overlay', min: 10, max: 80, step: 5 },
  ],
  feature_links: [
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 6 },
    { key: 'style', type: 'select', label: 'Kiểu dáng', options: [{value: 'card', label: 'Thẻ (Card)'}, {value: 'minimal', label: 'Đơn giản'}] },
    { key: '_content', type: 'list', label: 'Các thẻ tính năng', defaults: { bgColor: '#f8f9fa' }, fields: [
      { key: 'title', type: 'text', placeholder: 'Tiêu đề' },
      { key: 'subtitle', type: 'text', placeholder: 'Phụ đề (tùy chọn)' },
      { key: 'icon', type: 'media', placeholder: 'Icon / Ảnh' },
      { key: 'url', type: 'url', placeholder: 'Đường dẫn' },
      { key: 'bgColor', type: 'color', label: 'Màu nền thẻ' }
    ]}
  ],
  categories: [
    { key: 'columns', type: 'range', label: 'Số cột', min: 3, max: 10 },
    { key: 'showDescription', type: 'boolean', label: 'Hiện mô tả' },
    { key: 'layoutStyle', type: 'select', label: 'Bố cục', options: [{value: 'grid', label: 'Lưới'}, {value: 'carousel', label: 'Carousel'}, {value: 'circle_icon', label: 'Icon tròn'}, {value: 'masonry', label: 'Lưới bất đối xứng'}] },
    { key: 'showCount', type: 'boolean', label: 'Hiện số SP' },
    { key: 'selectedCategoryIds', type: 'categoryList', label: 'Chọn danh mục', multiple: true }
  ],
  flash_sale: [
    { key: 'theme', type: 'select', label: 'Giao diện', options: [{value: 'default', label: 'Mặc định'}, {value: 'orange_strip', label: 'Dải màu cam (Nổi bật)'}, {value: 'dark_mode', label: 'Nền tối (Sang trọng)'}, {value: 'rounded_cards', label: 'Bo tròn siêu mềm'}] },
    { key: 'showTimer', type: 'boolean', label: 'Hiện đếm ngược' },
    { key: 'showProgress', type: 'boolean', label: 'Hiện thanh tiến độ' },
    { key: 'count', type: 'range', label: 'Số SP', min: 4, max: 16 },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 5 }
  ],
  featured_products: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'layoutStyle', type: 'select', label: 'Bố cục', options: [{value: 'grid', label: 'Lưới'}, {value: 'carousel', label: 'Carousel'}, {value: 'elegant', label: 'Sang trọng'}, {value: 'minimal', label: 'Tối giản'}] },
    { key: 'count', type: 'range', label: 'Số lượng', min: 4, max: 16 },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 5 },
    { key: 'filterCategory', type: 'categorySelect', label: 'Lọc danh mục' },
    { key: 'sortOrder', type: 'select', label: 'Sắp xếp', options: [
      {value: 'newest', label: 'Mới nhất'}, {value: 'bestselling', label: 'Bán chạy'},
      {value: 'price_asc', label: 'Giá tăng'}, {value: 'price_desc', label: 'Giá giảm'}] },
    { key: 'slidesPerView', type: 'select', label: 'Slides/hàng', options: [{value: 2, label: '2'}, {value: 3, label: '3'}, {value: 4, label: '4'}] },
    { key: 'autoplay', type: 'boolean', label: 'Auto-scroll' },
    { key: 'autoplaySpeed', type: 'range', label: 'Tốc độ (ms)', condition: 'autoplay', min: 2000, max: 8000, step: 500 }
  ],
  new_arrivals: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'layoutStyle', type: 'select', label: 'Bố cục', options: [{value: 'grid', label: 'Lưới'}, {value: 'carousel', label: 'Carousel'}, {value: 'lookbook', label: 'Lookbook'}] },
    { key: 'count', type: 'range', label: 'Số lượng', min: 4, max: 12 },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 5 },
    { key: 'sortOrder', type: 'select', label: 'Sắp xếp', options: [
      {value: 'newest', label: 'Mới nhất'}, {value: 'bestselling', label: 'Bán chạy'},
      {value: 'price_asc', label: 'Giá tăng'}, {value: 'price_desc', label: 'Giá giảm'}] },
    { key: 'slidesPerView', type: 'select', label: 'Slides/hàng', options: [{value: 2, label: '2'}, {value: 3, label: '3'}] },
    { key: 'autoplay', type: 'boolean', label: 'Auto-scroll' }
  ],
  cms_pages: [
    { key: 'layout', type: 'select', label: 'Bố cục', options: [{value: 'grid', label: 'Lưới'}, {value: 'list', label: 'Danh sách'}] },
    { key: 'maxPages', type: 'range', label: 'Tối đa (trang)', min: 3, max: 12 }
  ],
  video_embed: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: '_content', type: 'list', label: 'Danh sách video', fields: [{ key: 'url', type: 'url', placeholder: 'URL video' }] }
  ],
  testimonials: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 4 },
    { key: '_content', type: 'list', label: 'Đánh giá', defaults: { rating: 5, avatar: '' }, fields: [
      { key: 'name', type: 'text', placeholder: 'Tên khách hàng' },
      { key: 'text', type: 'textarea', placeholder: 'Nhận xét' }
    ]}
  ],
  faq: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: '_content', type: 'list', label: 'Câu hỏi', fields: [
      { key: 'question', type: 'text', placeholder: 'Câu hỏi' },
      { key: 'answer', type: 'textarea', placeholder: 'Trả lời' }
    ]}
  ],
  image_gallery: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 5 },
    { key: '_content', type: 'list', label: 'Ảnh', fields: [
      { key: 'url', type: 'media', placeholder: 'URL ảnh' }
    ]}
  ],
  text_block: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: '_content', type: 'richtext', label: 'Nội dung' }
  ],
  newsletter: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' },
    { key: 'buttonText', type: 'text', label: 'Nút bấm' },
    { key: 'bgColor', type: 'color', label: 'Màu nền' },
    { key: 'textColor', type: 'color', label: 'Màu chữ' },
    { key: 'theme', type: 'select', label: 'Giao diện', options: [{value:'light',label:'Sáng'},{value:'dark',label:'Tối'},{value:'gradient',label:'Gradient'}] },
    { key: 'placeholderText', type: 'text', label: 'Placeholder', placeholder: 'Nhập email...' },
  ],
  form: [
    { key: 'title', type: 'text', label: 'Tiêu đề (Tùy chọn)' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề (Tùy chọn)' },
    { key: 'formId', type: 'formSelect', label: 'Chọn Biểu mẫu' },
    { key: 'submitText', type: 'text', label: 'Chữ Nút Gửi', placeholder: 'Gửi ngay' },
    { key: 'successMsg', type: 'textarea', label: 'Lời cảm ơn', placeholder: 'Kịch bản khi gửi thành công' }
  ],
  social_feed: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'displayStyle', type: 'select', label: 'Kiểu hiển thị', options: [{value:'icons',label:'Chỉ icon'},{value:'buttons',label:'Nút bấm'},{value:'cards',label:'Thẻ'}] },
    { key: 'showLabels', type: 'boolean', label: 'Hiện tên MXH' },
    { key: 'iconSize', type: 'select', label: 'Kích thước', options: [{value:'sm',label:'Nhỏ'},{value:'md',label:'Vừa'},{value:'lg',label:'Lớn'}] },
    { key: '_content', type: 'list', label: 'Liên kết', fields: [
      { key: 'platform', type: 'select', options: [{value:'facebook',label:'Facebook'}, {value:'instagram',label:'Instagram'}, {value:'youtube',label:'YouTube'}, {value:'tiktok',label:'TikTok'}, {value:'zalo',label:'Zalo'}, {value:'twitter',label:'Twitter/X'}, {value:'shopee',label:'Shopee'}, {value:'lazada',label:'Lazada'}] },
      { key: 'url', type: 'url', placeholder: 'URL' }
    ]}
  ],
  brands_slider: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: '_content', type: 'list', label: 'Hãng', fields: [
      { key: 'name', type: 'text', placeholder: 'Tên hãng' },
      { key: 'logo', type: 'media', placeholder: 'URL Logo' }
    ]}
  ],
  restaurant_menu: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' }
  ],
  booking_services: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' },
    { key: 'count', type: 'number', label: 'Số mục hiển thị', min: 1, max: 20 }
  ],
  salon_services: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' },
    { key: 'count', type: 'number', label: 'Số mục hiển thị', min: 1, max: 20 }
  ],
  property_listings: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' },
    { key: 'count', type: 'number', label: 'Số mục hiển thị', min: 1, max: 20 }
  ],
  upcoming_events: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' },
    { key: 'count', type: 'number', label: 'Số mục hiển thị', min: 1, max: 20 }
  ],
  custom_block: [
    { key: '_visual', type: 'visualEditor', label: 'Mở Visual Builder' }
  ],
  grid: [
    { key: 'columns', type: 'range', label: 'Số cột (Desktop)', min: 1, max: 12 },
    { key: 'tabletColumns', type: 'range', label: 'Số cột (Tablet)', min: 1, max: 12 },
    { key: 'mobileColumns', type: 'range', label: 'Số cột (Mobile)', min: 1, max: 12 },
    { key: 'gap', type: 'range', label: 'Khoảng cách (px)', min: 0, max: 64, step: 4 },
    { key: '_children', type: 'children', label: 'Nội dung lưới' }
  ],

  // ── Trust Badges (was missing entirely) ──
  trust_badges: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'layout', type: 'select', label: 'Bố cục', options: [{value:'row',label:'Hàng ngang'},{value:'grid',label:'Lưới'},{value:'carousel',label:'Carousel'}] },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 6 },
    { key: 'background', type: 'color', label: 'Màu nền' },
    { key: 'iconSize', type: 'select', label: 'Kích thước icon', options: [{value:'sm',label:'Nhỏ'},{value:'md',label:'Vừa'},{value:'lg',label:'Lớn'}] },
    { key: '_content', type: 'list', label: 'Badges', defaults: { icon: '' }, fields: [
      { key: 'title', type: 'text', placeholder: 'Tiêu đề badge' },
      { key: 'description', type: 'text', placeholder: 'Mô tả' },
      { key: 'icon', type: 'media', placeholder: 'URL icon/ảnh' },
    ]}
  ],

  // ── Blog Posts (enhanced) ──
  blog_posts: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' },
    { key: 'layoutView', type: 'select', label: 'Bố cục', options: [{value:'grid',label:'Lưới'},{value:'list',label:'Danh sách'},{value:'carousel',label:'Carousel'},{value:'featured',label:'Bài nổi bật + lưới'}] },
    { key: 'count', type: 'range', label: 'Số bài', min: 3, max: 12 },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 4 },
    { key: 'showExcerpt', type: 'boolean', label: 'Hiện trích dẫn' },
    { key: 'showDate', type: 'boolean', label: 'Hiện ngày đăng' },
    { key: 'showImage', type: 'boolean', label: 'Hiện ảnh đại diện' },
    { key: 'showAuthor', type: 'boolean', label: 'Hiện tác giả' },
    { key: 'showReadMore', type: 'boolean', label: 'Hiện nút Xem thêm' },
  ],

  // ══════════════════════════════════════════
  // System Page Section Schemas (dynamic composition)
  // ══════════════════════════════════════════
  page_breadcrumb: [
    { key: 'showHome', type: 'boolean', label: 'Hiện link Trang chủ' },
    { key: 'separator', type: 'select', label: 'Ký tự phân cách', options: [{value:'/',label:'/'},{value:'>',label:'>'},{value:'»',label:'»'},{value:'→',label:'→'}] },
  ],
  page_heading: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'subtitle', type: 'text', label: 'Phụ đề' },
    { key: 'alignment', type: 'select', label: 'Căn chỉnh', options: [{value:'left',label:'Trái'},{value:'center',label:'Giữa'},{value:'right',label:'Phải'}] },
    { key: 'tag', type: 'select', label: 'Thẻ HTML', options: [{value:'h1',label:'H1'},{value:'h2',label:'H2'},{value:'h3',label:'H3'}] },
  ],
  product_grid: [
    { key: 'columns', type: 'range', label: 'Số cột SP', min: 2, max: 5 },
    { key: 'itemsPerPage', type: 'select', label: 'SP mỗi trang', options: [{value:8,label:'8'},{value:12,label:'12'},{value:16,label:'16'},{value:24,label:'24'}] },
    { key: 'sidebarPosition', type: 'select', label: 'Sidebar', options: [{value:'left',label:'Bên trái'},{value:'right',label:'Bên phải'},{value:'hidden',label:'Ẩn'}] },
    { key: 'showFilters_category', type: 'boolean', label: 'Filter danh mục' },
    { key: 'showFilters_brand', type: 'boolean', label: 'Filter thương hiệu' },
    { key: 'showFilters_price', type: 'boolean', label: 'Filter giá' },
    { key: 'sortDefault', type: 'select', label: 'Sắp xếp mặc định', options: [{value:'newest',label:'Mới nhất'},{value:'bestselling',label:'Bán chạy'},{value:'price_asc',label:'Giá tăng'},{value:'price_desc',label:'Giá giảm'}] },
    { key: 'cardStyle', type: 'select', label: 'Kiểu thẻ SP', options: [{value:'default',label:'Mặc định'},{value:'minimal',label:'Tối giản'},{value:'overlay',label:'Overlay'}] },
  ],
  product_detail_view: [
    { key: 'galleryStyle', type: 'select', label: 'Gallery', options: [{value:'thumbnails',label:'Thumbnail'},{value:'grid',label:'Grid'},{value:'carousel',label:'Carousel'}] },
    { key: 'layoutRatio', type: 'select', label: 'Tỷ lệ layout', options: [{value:'50-50',label:'50/50'},{value:'60-40',label:'60/40'},{value:'40-60',label:'40/60'}] },
    { key: 'showBreadcrumb', type: 'boolean', label: 'Breadcrumb' },
    { key: 'showSKU', type: 'boolean', label: 'Hiện mã SKU' },
    { key: 'showStock', type: 'boolean', label: 'Hiện tồn kho' },
    { key: 'showShare', type: 'boolean', label: 'Nút chia sẻ' },
  ],
  product_reviews: [
    { key: 'showRatingSummary', type: 'boolean', label: 'Hiện tổng hợp đánh giá' },
    { key: 'showWriteReview', type: 'boolean', label: 'Cho phép viết đánh giá' },
    { key: 'perPage', type: 'select', label: 'Số đánh giá/trang', options: [{value:5,label:'5'},{value:10,label:'10'},{value:20,label:'20'}] },
  ],
  related_products: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: 'count', type: 'range', label: 'Số SP', min: 4, max: 12 },
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 5 },
    { key: 'layoutStyle', type: 'select', label: 'Bố cục', options: [{value:'grid',label:'Lưới'},{value:'carousel',label:'Carousel'}] },
  ],
  cart_summary: [
    { key: 'showThumbnails', type: 'boolean', label: 'Hiện ảnh SP' },
    { key: 'showQuantityControls', type: 'boolean', label: 'Nút tăng/giảm SL' },
    { key: 'showCoupon', type: 'boolean', label: 'Ô nhập mã giảm giá' },
    { key: 'layout', type: 'select', label: 'Bố cục', options: [{value:'full',label:'Toàn trang'},{value:'sidebar',label:'Có sidebar'}] },
  ],
  checkout_form: [
    { key: 'layout', type: 'select', label: 'Bố cục', options: [{value:'two-column',label:'2 cột'},{value:'single-column',label:'1 cột'}] },
    { key: 'showCoupon', type: 'boolean', label: 'Mã giảm giá' },
    { key: 'showNotes', type: 'boolean', label: 'Ghi chú đơn hàng' },
    { key: 'showSteps', type: 'boolean', label: 'Thanh tiến trình' },
  ],
  auth_form: [
    { key: 'allowRegister', type: 'boolean', label: 'Cho phép đăng ký' },
    { key: 'allowForgotPassword', type: 'boolean', label: 'Quên mật khẩu' },
    { key: 'cardMaxWidth', type: 'range', label: 'Chiều rộng card (px)', min: 360, max: 600, step: 20 },
    { key: 'showSocialLogin', type: 'boolean', label: 'Đăng nhập MXH' },
  ],
  account_dashboard: [
    { key: 'sidebarPosition', type: 'select', label: 'Sidebar', options: [{value:'left',label:'Bên trái'},{value:'right',label:'Bên phải'}] },
    { key: 'showOrders', type: 'boolean', label: 'Tab đơn hàng' },
    { key: 'showAddresses', type: 'boolean', label: 'Tab địa chỉ' },
    { key: 'showPasswordChange', type: 'boolean', label: 'Tab đổi mật khẩu' },
  ],
  order_history: [
    { key: 'perPage', type: 'select', label: 'Đơn hàng/trang', options: [{value:5,label:'5'},{value:10,label:'10'},{value:20,label:'20'}] },
    { key: 'showStatus', type: 'boolean', label: 'Hiện trạng thái' },
  ],
  blog_listing: [
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 4 },
    { key: 'postsPerPage', type: 'select', label: 'Bài/trang', options: [{value:6,label:'6'},{value:9,label:'9'},{value:12,label:'12'}] },
    { key: 'layout', type: 'select', label: 'Bố cục', options: [{value:'grid',label:'Lưới'},{value:'list',label:'Danh sách'},{value:'masonry',label:'Masonry'}] },
    { key: 'showSidebar', type: 'boolean', label: 'Sidebar' },
  ],
  wishlist_grid: [
    { key: 'columns', type: 'range', label: 'Số cột', min: 2, max: 5 },
    { key: 'emptyMessage', type: 'text', label: 'Thông báo khi trống', placeholder: 'Chưa có sản phẩm yêu thích' },
  ]
};

export const styleSchema = [
  { key: 'sectionBgColor', type: 'color', label: 'Màu nền' },
  { key: 'sectionPadding', type: 'select', label: 'Padding', options: [
    {value: '', label: 'Mặc định'}, 
    {value: 'sm', label: 'Nhỏ'}, 
    {value: 'md', label: 'Vừa'}, 
    {value: 'lg', label: 'Lớn'}, 
    {value: 'xl', label: 'Rất lớn'}
  ]},
  { key: 'anchorId', type: 'text', label: 'Anchor ID' },
  { key: 'cssClass', type: 'text', label: 'CSS Class' }
];

/**
 * Helper: get section types grouped by category.
 * Used by the "Add Section" UI to show sections in module groups.
 */
export function getSectionsByCategory(installedModules = []) {
  const groups = {}

  for (const [type, meta] of Object.entries(sectionMeta)) {
    // Skip sections whose module is not installed
    if (meta.moduleId && !installedModules.includes(meta.moduleId)) continue

    const cat = meta.category || 'Khác'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push({ type, ...meta })
  }

  return groups
}

/**
 * Helper: get all available section types for a tenant.
 * Returns only sections whose required module is installed (or has no module requirement).
 */
export function getAvailableSections(installedModules = []) {
  return Object.entries(sectionMeta)
    .filter(([, meta]) => !meta.moduleId || installedModules.includes(meta.moduleId))
    .map(([type, meta]) => ({ type, ...meta }))
}

/**
 * Helper: get all section types including unavailable ones (for showing disabled items).
 */
export function getAllSectionsWithAvailability(installedModules = []) {
  return Object.entries(sectionMeta).map(([type, meta]) => ({
    type,
    ...meta,
    available: !meta.moduleId || installedModules.includes(meta.moduleId)
  }))
}
