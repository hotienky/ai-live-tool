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
  banner:        { label: 'Banner / Slider',     moduleId: null, category: 'Cơ bản',       icon: '🖼️', description: 'Slideshow ảnh quảng cáo' },
  image_banner:  { label: 'Promo Banner',        moduleId: null, category: 'Cơ bản',       icon: '🏷️', description: 'Banner ảnh đơn (FullWidth)' },
  feature_links: { label: 'Tính năng nhanh',     moduleId: null, category: 'Cơ bản',       icon: '⚡', description: 'Các thẻ chức năng nổi bật' },
  cms_pages:     { label: 'Trang CMS',           moduleId: 'cms', category: 'Cơ bản',      icon: '📄', description: 'Hiển thị danh sách trang' },
  text_block:    { label: 'Khối văn bản',        moduleId: null, category: 'Cơ bản',       icon: '📝', description: 'Đoạn text tùy chỉnh' },
  image_gallery: { label: 'Bộ sưu tập ảnh',     moduleId: null, category: 'Cơ bản',       icon: '🖼️', description: 'Gallery hình ảnh' },
  video_embed:   { label: 'Video nhúng',         moduleId: null, category: 'Cơ bản',       icon: '🎬', description: 'YouTube/Vimeo embed' },
  testimonials:  { label: 'Đánh giá khách hàng', moduleId: null, category: 'Cơ bản',       icon: '⭐', description: 'Testimonials / Reviews' },
  faq:           { label: 'Câu hỏi thường gặp', moduleId: null, category: 'Cơ bản',       icon: '❓', description: 'FAQ accordion' },
  newsletter:    { label: 'Đăng ký nhận tin',    moduleId: null, category: 'Cơ bản',       icon: '📧', description: 'Form đăng ký email' },
  social_feed:   { label: 'Mạng xã hội',        moduleId: null, category: 'Cơ bản',       icon: '📱', description: 'Links social media' },
  trust_badges:  { label: 'Trust Badges',        moduleId: null, category: 'Cơ bản',       icon: '🛡️', description: 'Huy hiệu uy tín' },
  brands_slider: { label: 'Thương hiệu',        moduleId: null, category: 'Cơ bản',       icon: '🏷️', description: 'Slide logo đối tác' },

  // ── Layout / Structure ──
  grid:          { label: 'Lưới bố cục',         moduleId: null, category: 'Bố cục',       icon: '📐', description: 'Layout grid nhiều cột' },
  custom_block:  { label: 'Visual Block',        moduleId: null, category: 'Bố cục',       icon: '🔲', description: 'Block builder nâng cao' },

  // ── E-Commerce (requires 'ecom' module) ──
  categories:        { label: 'Danh mục SP',         moduleId: 'ecom', category: 'E-Commerce', icon: '📁', description: 'Hiển thị danh mục sản phẩm' },
  featured_products: { label: 'Sản phẩm nổi bật',    moduleId: 'ecom', category: 'E-Commerce', icon: '🛒', description: 'Grid sản phẩm nổi bật' },
  new_arrivals:      { label: 'Hàng mới về',         moduleId: 'ecom', category: 'E-Commerce', icon: '🆕', description: 'Sản phẩm mới nhất' },
  flash_sale:        { label: 'Flash Sale',           moduleId: 'ecom', category: 'E-Commerce', icon: '⚡', description: 'Đếm ngược giảm giá' },

  // ── Blog (requires 'blog' module) ──
  blog_posts:        { label: 'Bài viết gần đây',    moduleId: 'blog', category: 'Blog',       icon: '✏️', description: 'Danh sách bài viết mới' },

  // ── Restaurant (requires 'restaurant' module) ──
  restaurant_menu:   { label: 'Thực đơn',            moduleId: 'restaurant', category: 'Nhà hàng', icon: '🍽️', description: 'Hiển thị thực đơn' },

  // ── Booking (requires 'booking' module) ──
  booking_services:  { label: 'Dịch vụ đặt lịch',    moduleId: 'booking', category: 'Đặt lịch',   icon: '📅', description: 'Danh sách dịch vụ đặt lịch' },

  // ── Salon (requires 'salon' module) ──
  salon_services:    { label: 'Dịch vụ Spa/Salon',   moduleId: 'salon', category: 'Spa & Salon', icon: '💆', description: 'Danh sách dịch vụ spa' },

  // ── Real Estate (requires 'realestate' module) ──
  property_listings: { label: 'Bất động sản',        moduleId: 'realestate', category: 'BĐS',    icon: '🏠', description: 'Tin đăng BĐS mới nhất' },

  // ── Events (requires 'events' module) ──
  upcoming_events:   { label: 'Sự kiện sắp tới',     moduleId: 'events', category: 'Sự kiện',    icon: '🎉', description: 'Danh sách sự kiện' },
}

// ══════════════════════════════════════════
// Section Config Schemas — used by config panel
// ══════════════════════════════════════════
export const sectionSchemas = {
  banner: [
    { key: 'autoplay', type: 'boolean', label: 'Tự chuyển (Autoplay)' },
    { key: 'interval', type: 'number', label: 'Tốc độ (ms)', condition: 'autoplay', min: 1000, max: 10000, step: 500 },
    { key: 'height', type: 'select', label: 'Chiều cao', options: [{value: 'sm', label: 'Nhỏ'}, {value: 'md', label: 'Vừa'}, {value: 'lg', label: 'Lớn'}] }
  ],
  image_banner: [
    { key: 'desktopImage', type: 'media', label: 'Ảnh Desktop' },
    { key: 'mobileImage', type: 'media', label: 'Ảnh Mobile (Tùy chọn)' },
    { key: 'link', type: 'url', label: 'Đường dẫn (Link)' },
    { key: 'fullWidth', type: 'boolean', label: 'Rộng toàn màn hình' }
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
    { key: 'buttonText', type: 'text', label: 'Nút bấm' }
  ],
  social_feed: [
    { key: 'title', type: 'text', label: 'Tiêu đề' },
    { key: '_content', type: 'list', label: 'Liên kết', fields: [
      { key: 'platform', type: 'select', options: [{value:'facebook',label:'Facebook'}, {value:'instagram',label:'Instagram'}, {value:'youtube',label:'YouTube'}, {value:'tiktok',label:'TikTok'}] },
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
