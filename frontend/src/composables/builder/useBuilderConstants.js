import {
  ShoppingBag, ShoppingCart, User, Truck, BookOpen, Store, Package,
  Image, Grid3x3, Zap, Sparkles, Clock, Newspaper,
  Monitor, Smartphone, Layers, CreditCard,
  MessageSquareQuote, HelpCircle, Images, Video, Type, Mail, Share2, Award,
  Home, Heart, Lock, FileText, Paintbrush,
  Tag, Shield, LayoutGrid, ChevronLeft, PanelTop, PanelBottom,
  Aperture, Megaphone, FolderOpen, ShieldCheck, Star, Film, Box,
  CalendarDays, UtensilsCrossed, Flower2, Building2, PartyPopper,
  Target, FileStack, FileEdit
} from 'lucide-vue-next'

export function createBuilderConstants(t) {
  const defaultHeaderConfig = {
    logoPosition: 'left',
    maxNavLinks: 5,
    showSearch: true,
    sticky: true,
    showThemeToggle: true,
    translations: {}
  }

  const defaultFooterConfig = {
    columns: [
      { title: t('admin.msg_1437f79c', 'Về chúng tôi'), type: 'links', links: [{ label: t('admin.msg_33f0741f', 'Giới thiệu'), url: '/page/gioi-thieu' }, { label: t('admin.msg_98b31963', 'Chính sách bảo mật'), url: '/page/chinh-sach-bao-mat' }] },
      { title: t('admin.msg_c1513256', 'Hỗ trợ'), type: 'links', links: [{ label: t('admin.msg_6aba341e', 'Chính sách vận chuyển'), url: '/page/chinh-sach-van-chuyen' }, { label: t('admin.msg_0ea7d28b', 'Đổi trả & Hoàn tiền'), url: '/page/doi-tra' }] },
      { title: t('admin.msg_9276b119', 'Liên hệ'), type: 'contact', items: [{ icon: 'phone', label: 'Hotline', value: '' }, { icon: 'email', label: 'Email', value: '' }] },
    ],
    social: [],
    paymentMethods: ['cod', 'bank'],
    badges: [],
    legalText: '',
    copyrightText: '',
    bgColor: '',
    textColor: '',
    headingColor: '',
    translations: {}
  }

  const defaultPromoConfig = {
    enabled: true,
    text: '🎉 Miễn phí vận chuyển cho đơn từ 500K — Mua ngay!',
    link: '/products',
    ctaText: 'Mua sắm',
    bgColor: '#7c3aed',
    textColor: '#ffffff',
    fontSize: '13px',
    dismissible: true,
  }

  const defaultPageConfigs = {
    products: {
      sidebarPosition: 'left',
      gridColumns: 4,
      itemsPerPage: 12,
      showFilters: { category: true, brand: true, price: true },
      pageTitle: t('admin.msg_1d1aa192', 'Sản phẩm'),
      pageDescription: '',
      translations: {},
    },
    productDetail: {
      galleryStyle: 'thumbnails',
      layoutRatio: '50-50',
      showBreadcrumb: true,
      showRelatedProducts: true,
      relatedCount: 6,
      showReviews: true,
      pageTitle: t('admin.msg_6055caf1', 'Chi tiết sản phẩm'),
      pageDescription: '',
      translations: {},
    },
    checkout: {
      showCoupon: true,
      showNotes: true,
      showSteps: true,
      layout: 'two-column',
      pageTitle: t('admin.msg_d555e4bc', 'Thanh toán'),
      pageDescription: '',
      translations: {},
    },
    auth: {
      allowRegister: true,
      allowForgotPassword: true,
      showSocialLogin: false,
      cardMaxWidth: 440,
      pageTitle: t('admin.msg_50e04c81', 'Đăng nhập / Đăng ký'),
      pageDescription: '',
      translations: {},
    },
    account: {
      showOrders: true,
      showAddresses: true,
      showPasswordChange: true,
      sidebarPosition: 'left',
      pageTitle: t('admin.msg_7bd53616', 'Tài khoản'),
      pageDescription: '',
      translations: {},
    },
    blog: {
      gridColumns: 3,
      postsPerPage: 9,
      layout: 'grid',
      pageTitle: 'Blog',
      pageDescription: '',
      translations: {},
    },
  }

  const sectionMeta = {
    banner: { label: 'Banner', icon: Image, pvHeight: '50px' },
    image_banner: { label: 'Promo Banner', icon: Tag, pvHeight: '40px' },
    feature_links: { label: 'Tính năng nhanh', icon: Zap, pvHeight: '25px' },
    categories: { label: t('admin.msg_53d8de58', 'Danh mục'), icon: Grid3x3, pvHeight: '25px' },
    flash_sale: { label: 'Flash Sale', icon: Zap, pvHeight: '35px' },
    featured_products: { label: t('admin.msg_c90c3bbc', 'Sản phẩm nổi bật'), icon: Sparkles, pvHeight: '60px' },
    new_arrivals: { label: t('admin.msg_f0676ad7', 'Hàng mới về'), icon: Clock, pvHeight: '60px' },
    cms_pages: { label: 'Trang CMS', icon: BookOpen, pvHeight: '30px' },
    blog_posts: { label: 'Bài viết gần đây', icon: Newspaper, pvHeight: '45px' },
    trust_badges: { label: 'Trust Badges', icon: Shield, pvHeight: '25px' },
    grid: { label: 'Lưới bố cục', icon: LayoutGrid, pvHeight: '50px' },
    // Library sections (Phase 3)
    testimonials: { label: t('admin.msg_a4e1b16a', 'Đánh giá KH'), icon: MessageSquareQuote, pvHeight: '45px' },
    faq: { label: 'FAQ', icon: HelpCircle, pvHeight: '40px' },
    image_gallery: { label: t('admin.msg_c1962630', 'Thư viện ảnh'), icon: Images, pvHeight: '50px' },
    video_embed: { label: 'Video', icon: Video, pvHeight: '55px' },
    text_block: { label: t('admin.msg_ec4344e3', 'Khối văn bản'), icon: Type, pvHeight: '35px' },
    newsletter: { label: t('admin.msg_26a469cd', 'Đăng ký email'), icon: Mail, pvHeight: '30px' },
    social_feed: { label: t('admin.msg_0f1252b7', 'Mạng xã hội'), icon: Share2, pvHeight: '25px' },
    brands_slider: { label: t('admin.msg_161416d9', 'Thương hiệu'), icon: Award, pvHeight: '30px' },
    custom_block: { label: 'Visual Builder', icon: Paintbrush, pvHeight: '60px' },
    restaurant_menu: { label: 'Thực đơn Nhà Hàng', icon: BookOpen, pvHeight: '80px' },
    booking_services: { label: 'Dịch vụ Đặt lịch', icon: Clock, pvHeight: '60px' },
    salon_services: { label: 'Dịch vụ Spa & Salon', icon: Sparkles, pvHeight: '60px' },
    property_listings: { label: 'Bất Động Sản', icon: Image, pvHeight: '70px' },
    upcoming_events: { label: 'Sự Kiện Sắp Tới', icon: Zap, pvHeight: '60px' },
    system_page_content: { label: 'Lõi Trang Hệ Thống', icon: Box, pvHeight: '100px' },
    // System page sections (dynamic composition)
    page_breadcrumb:     { label: 'Breadcrumb',        icon: Target,  pvHeight: '15px' },
    page_heading:        { label: 'Tiêu đề trang',     icon: Type,    pvHeight: '25px' },
    product_grid:        { label: 'Lưới sản phẩm',     icon: LayoutGrid, pvHeight: '80px' },
    product_detail_view: { label: 'Chi tiết SP',       icon: Package, pvHeight: '100px' },
    product_reviews:     { label: 'Đánh giá SP',        icon: Star,    pvHeight: '60px' },
    related_products:    { label: 'SP liên quan',       icon: Sparkles, pvHeight: '60px' },
    cart_summary:        { label: 'Giỏ hàng',           icon: ShoppingCart, pvHeight: '80px' },
    checkout_form:       { label: 'Form thanh toán',    icon: CreditCard, pvHeight: '100px' },
    auth_form:           { label: 'Đăng nhập/ĐK',      icon: Lock,    pvHeight: '80px' },
    account_dashboard:   { label: 'Tài khoản',          icon: User,    pvHeight: '80px' },
    order_history:       { label: 'Lịch sử đơn',       icon: FileStack, pvHeight: '60px' },
    blog_listing:        { label: 'DS bài viết',       icon: BookOpen, pvHeight: '80px' },
    wishlist_grid:       { label: 'Yêu thích',          icon: Heart,   pvHeight: '60px' },
  }

  const defaultParams = {
    system_page_content: { title: '' },
    banner: { autoplay: true, interval: 4000, height: 'md' },
    categories: { columns: 6, showDescription: false, layoutStyle: 'grid', showCount: false, selectedCategoryIds: [] },
    flash_sale: { showTimer: true, showProgress: true, count: 8, columns: 4 },
    featured_products: { title: t('admin.msg_c90c3bbc', 'Sản phẩm nổi bật'), count: 8, columns: 4, filterCategory: '', sortOrder: 'newest', slidesPerView: 2, autoplay: true, autoplaySpeed: 4000 },
    new_arrivals: { title: t('admin.msg_f0676ad7', 'Hàng mới về'), count: 6, columns: 4, sortOrder: 'newest', slidesPerView: 2, autoplay: true, autoplaySpeed: 5000 },
    cms_pages: { layout: 'grid', maxPages: 6 },
    testimonials: { title: t('admin.msg_e7334e0f', 'Khách hàng nói gì'), columns: 3 },
    faq: { title: t('admin.msg_65b83ce0', 'Câu hỏi thường gặp') },
    image_gallery: { title: t('admin.msg_c1962630', 'Thư viện ảnh'), columns: 3 },
    video_embed: { title: 'Video' },
    text_block: { title: '' },
    newsletter: { title: t('admin.msg_9a76bcab', 'Đăng ký nhận tin'), subtitle: t('admin.msg_e3809562', 'Nhận thông tin khuyến mãi và sản phẩm mới nhất'), buttonText: t('admin.msg_0bb0951d', 'Đăng ký') },
    social_feed: { title: t('admin.msg_d4a4c495', 'Theo dõi chúng tôi') },
    brands_slider: { title: t('admin.msg_161416d9', 'Thương hiệu'), animationSpeed: 20 },
    custom_block: { title: '' },
    restaurant_menu: { title: 'Thực Đơn Nhà Hàng', subtitle: 'Khám phá hương vị tinh tế' },
    booking_services: { title: 'Dịch Vụ Nổi Bật', subtitle: 'Đặt lịch dễ dàng, nhanh chóng', count: 6 },
    salon_services: { title: 'Dịch Vụ Spa & Salon', subtitle: 'Thư giãn và làm mới bản thân', count: 6 },
    property_listings: { title: 'Bất Động Sản Nổi Bật', subtitle: 'Tìm ngôi nhà mơ ước của bạn', count: 6 },
    upcoming_events: { title: 'Sự Kiện Sắp Tới', subtitle: 'Đừng bỏ lỡ những trải nghiệm tuyệt vời', count: 6 },
    // System page section defaults
    page_breadcrumb: { showHome: true, separator: '»' },
    page_heading: { title: '', subtitle: '', alignment: 'left', tag: 'h1' },
    product_grid: { columns: 4, itemsPerPage: 12, sidebarPosition: 'left', showFilters_category: true, showFilters_brand: true, showFilters_price: true, sortDefault: 'newest', cardStyle: 'default' },
    product_detail_view: { galleryStyle: 'thumbnails', layoutRatio: '50-50', showBreadcrumb: true, showSKU: true, showStock: true, showShare: true },
    product_reviews: { showRatingSummary: true, showWriteReview: true, perPage: 10 },
    related_products: { title: 'Sản phẩm liên quan', count: 6, columns: 4, layoutStyle: 'carousel' },
    cart_summary: { showThumbnails: true, showQuantityControls: true, showCoupon: true, layout: 'full' },
    checkout_form: { layout: 'two-column', showCoupon: true, showNotes: true, showSteps: true },
    auth_form: { allowRegister: true, allowForgotPassword: true, cardMaxWidth: 440, showSocialLogin: false },
    account_dashboard: { sidebarPosition: 'left', showOrders: true, showAddresses: true, showPasswordChange: true },
    order_history: { perPage: 10, showStatus: true },
    blog_listing: { columns: 3, postsPerPage: 9, layout: 'grid', showSidebar: false },
    wishlist_grid: { columns: 4, emptyMessage: 'Chưa có sản phẩm yêu thích' },
  }

  const pageList = [
    { key: 'products', label: t('admin.msg_1d1aa192', 'Sản phẩm'), icon: ShoppingBag, path: '/products' },
    { key: 'cart', label: t('admin.msg_6b413a7c', 'Giỏ hàng'), icon: ShoppingCart, path: '/cart' },
    { key: 'account', label: t('admin.msg_7bd53616', 'Tài khoản'), icon: User, path: '/account' },
    { key: 'auth', label: t('admin.msg_9a192725', 'Đăng nhập'), icon: User, path: '/auth' },
    { key: 'order_tracking', label: t('admin.msg_45fc7ddf', 'Tra cứu đơn'), icon: Truck, path: '/order-tracking' },
  ]

  const templates = [
    { key: 'pharmacy', name: 'Nhà Thuốc / Y Tế', desc: 'Bán lẻ dược phẩm', icon: Store },
    { key: 'fashion', name: 'Thời Trang', desc: 'Quần áo, phụ kiện', icon: Package },
    { key: 'restaurant', name: 'Nhà Hàng / F&B', desc: 'Menu, đặt bàn', icon: BookOpen },
    { key: 'spa', name: 'Spa & Salon', desc: 'Dịch vụ, Đặt lịch', icon: Sparkles },
    { key: 'realestate', name: 'Bất Động Sản', desc: 'Dự án, Tin tức', icon: Image },
  ]

  const builtinPageOptions = [
    { id: '__products',       label: t('admin.msg_4c779e64', 'Trang sản phẩm'),    icon: ShoppingBag },
    { id: '__productDetail',  label: t('admin.msg_6055caf1', 'Chi tiết sản phẩm'), icon: Package },
    { id: '__checkout',       label: t('admin.msg_d555e4bc', 'Thanh toán'),          icon: CreditCard },
    { id: '__auth',           label: t('admin.msg_50e04c81', 'Đăng nhập / Đăng ký'), icon: Lock },
    { id: '__account',        label: t('admin.msg_7bd53616', 'Tài khoản'),           icon: User },
    { id: '__wishlist',       label: t('admin.msg_2958eac6', 'Yêu thích'),          icon: Heart },
    { id: '__cart',           label: t('admin.msg_6b413a7c', 'Giỏ hàng'),           icon: ShoppingCart },
    { id: '__order_tracking', label: t('admin.msg_45fc7ddf', 'Tra cứu đơn'),        icon: Truck },
    { id: '__blog',           label: 'Blog',                                          icon: BookOpen },
    { id: '__template_product_card', label: '[Template] Thẻ Sản phẩm',            icon: Layers },
    { id: '__template_blog_card',    label: '[Template] Thẻ Bài viết',            icon: Layers },
  ]

  return {
    defaultHeaderConfig,
    defaultFooterConfig,
    defaultPromoConfig,
    defaultPageConfigs,
    sectionMeta,
    defaultParams,
    pageList,
    templates,
    builtinPageOptions,
  }
}
