/**
 * Industry-Specific Builder Configs
 *
 * Each industry defines: available sections, blocks, page types, and sample layouts.
 * Used by StorefrontLayoutBuilder to filter the section/block library.
 */

const coreBlocks = ['heading', 'text', 'image', 'button', 'spacer', 'divider', 'video', 'icon', 'html', 'columns']

export const industryConfigs = {
  ecommerce: {
    label: 'Cửa hàng Online',
    icon: 'ShoppingBag',
    requiredModules: ['ecom'],
    availableSections: [
      'banner', 'product_grid', 'categories', 'flash_sale',
      'featured_products', 'new_arrivals', 'brands_slider', 'promotions',
      'testimonials', 'newsletter', 'faq', 'text_block', 'image_gallery',
    ],
    availableBlocks: [
      ...coreBlocks,
      'product_card', 'add_to_cart', 'price_display', 'product_carousel',
      'cart_summary', 'promo_banner',
    ],
    pageTypes: ['home', 'products', 'product_detail', 'cart', 'checkout', 'account'],
    sampleSections: [
      { type: 'banner', preset: 'ecom_hero' },
      { type: 'categories', preset: 'ecom_categories' },
      { type: 'featured_products', preset: 'trending' },
      { type: 'flash_sale', preset: 'countdown' },
      { type: 'testimonials', preset: 'customer_reviews' },
      { type: 'newsletter', preset: 'signup_cta' },
    ],
  },

  blog: {
    label: 'Blog / Tin tức',
    icon: 'BookOpen',
    requiredModules: ['blog'],
    availableSections: [
      'banner', 'blog', 'cms_pages', 'newsletter',
      'testimonials', 'faq', 'social_feed', 'text_block',
      'image_gallery', 'video',
    ],
    availableBlocks: [
      ...coreBlocks,
      'post_card', 'author_bio', 'reading_progress', 'social_share',
      'related_posts', 'comment_section', 'table_of_contents',
    ],
    pageTypes: ['home', 'post_listing', 'single_post', 'category', 'author'],
    sampleSections: [
      { type: 'banner', preset: 'blog_hero' },
      { type: 'blog', preset: 'latest_posts' },
      { type: 'newsletter', preset: 'subscribe' },
    ],
  },

  lms: {
    label: 'Khóa học Online',
    icon: 'GraduationCap',
    requiredModules: ['lms'],
    availableSections: [
      'banner', 'testimonials', 'faq', 'text_block',
      'newsletter', 'video', 'image_gallery',
    ],
    availableBlocks: [
      ...coreBlocks,
      'course_card', 'lesson_list', 'progress_bar', 'pricing_card',
      'instructor_card', 'enrollment_button',
    ],
    pageTypes: ['home', 'courses', 'course_detail', 'lesson', 'dashboard'],
    sampleSections: [
      { type: 'banner', preset: 'lms_hero' },
      { type: 'testimonials', preset: 'student_reviews' },
      { type: 'faq', preset: 'course_faq' },
    ],
  },

  booking: {
    label: 'Đặt lịch / Dịch vụ',
    icon: 'Calendar',
    requiredModules: ['booking'],
    availableSections: [
      'banner', 'testimonials', 'faq', 'text_block',
      'image_gallery', 'newsletter', 'video',
    ],
    availableBlocks: [
      ...coreBlocks,
      'service_card', 'booking_button', 'calendar_widget', 'staff_card',
      'before_after_slider', 'opening_hours_table', 'google_map',
    ],
    pageTypes: ['home', 'services', 'service_detail', 'booking', 'account'],
    sampleSections: [
      { type: 'banner', preset: 'booking_hero' },
      { type: 'testimonials', preset: 'client_reviews' },
    ],
  },

  restaurant: {
    label: 'Nhà hàng / F&B',
    icon: 'UtensilsCrossed',
    requiredModules: ['restaurant'],
    availableSections: [
      'banner', 'testimonials', 'image_gallery', 'text_block',
      'faq', 'newsletter', 'video',
    ],
    availableBlocks: [
      ...coreBlocks,
      'menu_item', 'food_card', 'reservation_form', 'delivery_button',
      'chef_card', 'qr_menu', 'price_tag',
    ],
    pageTypes: ['home', 'menu', 'reservation', 'delivery', 'about'],
    sampleSections: [
      { type: 'banner', preset: 'restaurant_hero' },
      { type: 'image_gallery', preset: 'food_gallery' },
    ],
  },

  portfolio: {
    label: 'Portfolio / Agency',
    icon: 'Palette',
    requiredModules: [],
    availableSections: [
      'banner', 'image_gallery', 'testimonials', 'text_block',
      'faq', 'newsletter', 'video',
    ],
    availableBlocks: [
      ...coreBlocks,
      'project_card', 'skill_bar', 'counter_stat', 'client_logo',
      'timeline_item', 'lightbox_image',
    ],
    pageTypes: ['home', 'projects', 'project_detail', 'about', 'contact'],
    sampleSections: [
      { type: 'banner', preset: 'portfolio_hero' },
      { type: 'image_gallery', preset: 'project_showcase' },
    ],
  },

  business: {
    label: 'Landing Page / Doanh nghiệp',
    icon: 'Building2',
    requiredModules: [],
    availableSections: [
      'banner', 'testimonials', 'faq', 'text_block',
      'newsletter', 'image_gallery', 'video',
    ],
    availableBlocks: [
      ...coreBlocks,
      'feature_card', 'pricing_card', 'cta_button', 'stat_counter',
      'trust_badge',
    ],
    pageTypes: ['home', 'about', 'services', 'pricing', 'contact'],
    sampleSections: [
      { type: 'banner', preset: 'business_hero' },
      { type: 'testimonials', preset: 'client_testimonials' },
      { type: 'faq', preset: 'business_faq' },
    ],
  },

  blank: {
    label: 'Trống (Tất cả)',
    icon: 'Square',
    requiredModules: [],
    availableSections: null, // null = show all
    availableBlocks: null,
    pageTypes: ['home'],
    sampleSections: [],
  },
}

/**
 * Get industry config by key.
 */
export function getIndustryConfig(key) {
  return industryConfigs[key] || industryConfigs.blank
}

/**
 * List all industries for the onboarding wizard.
 */
export function listIndustries() {
  return Object.entries(industryConfigs).map(([key, config]) => ({
    key,
    ...config,
  }))
}

export default industryConfigs
