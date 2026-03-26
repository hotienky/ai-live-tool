/**
 * Section Templates Registry
 * 
 * Each section type has multiple visual templates.
 * Each template defines:
 *   - id: unique key
 *   - name: display name
 *   - description: short helper text
 *   - svgPreview: inline SVG string for visual thumbnail
 *   - config: params to merge when applied
 *   - tags: for filtering
 */

// ── SVG Thumbnail Generators ──
// These return compact inline SVGs that visually represent each template style.

const COLORS = {
  bg: '#f0f1f3',
  card: '#fff',
  accent: '#6366f1',
  text: '#94a3b8',
  dark: '#1e293b',
  orange: '#f97316',
  green: '#10b981',
  pink: '#ec4899',
}

function svgWrap(inner, w = 200, h = 120) {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:8px;background:${COLORS.bg}">${inner}</svg>`
}

// ══════════════════════════════════════════
// Flash Sale Templates
// ══════════════════════════════════════════
const flashSaleTemplates = [
  {
    id: 'default',
    name: 'Cơ bản',
    description: 'Nền trắng tinh tế, card sản phẩm đơn giản',
    tags: ['clean', 'light'],
    config: { theme: 'default' },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="180" height="16" rx="3" fill="${COLORS.accent}" opacity="0.15"/>
      <rect x="16" y="12" width="60" height="8" rx="2" fill="${COLORS.accent}"/>
      <rect x="140" y="12" width="40" height="8" rx="2" fill="${COLORS.text}" opacity="0.4"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="32" width="42" height="54" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
        <rect x="${13 + i * 47}" y="35" width="36" height="24" rx="2" fill="${COLORS.bg}"/>
        <rect x="${13 + i * 47}" y="63" width="28" height="4" rx="1" fill="${COLORS.text}" opacity="0.5"/>
        <rect x="${13 + i * 47}" y="70" width="20" height="5" rx="1" fill="#ef4444"/>
        <rect x="${13 + i * 47}" y="78" width="14" height="3" rx="1" fill="${COLORS.text}" opacity="0.3"/>
      `).join('')}
      <rect x="10" y="96" width="180" height="3" rx="1" fill="${COLORS.accent}" opacity="0.12"/>
      <rect x="10" y="96" width="120" height="3" rx="1" fill="${COLORS.accent}" opacity="0.5"/>
    `),
  },
  {
    id: 'orange_strip',
    name: 'Dải cam nổi bật',
    description: 'Nền cam rực rỡ — phong cách Pharmacity',
    tags: ['vibrant', 'ecommerce'],
    config: { theme: 'orange_strip' },
    svgPreview: svgWrap(`
      <rect width="200" height="120" fill="${COLORS.orange}"/>
      <rect x="12" y="10" width="50" height="10" rx="2" fill="#fff"/>
      <rect x="70" y="10" width="6" height="10" rx="1" fill="#222"/>
      <rect x="78" y="10" width="6" height="10" rx="1" fill="#222"/>
      <rect x="86" y="10" width="6" height="10" rx="1" fill="#222"/>
      <text x="155" y="18" font-size="7" fill="#fff" opacity="0.8" font-family="sans-serif">Xem tất cả →</text>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="28" width="42" height="58" rx="4" fill="#fff"/>
        <rect x="${13 + i * 47}" y="31" width="36" height="24" rx="2" fill="#fef3c7"/>
        <rect x="${13 + i * 47}" y="60" width="24" height="4" rx="1" fill="#333"/>
        <rect x="${13 + i * 47}" y="67" width="18" height="5" rx="1" fill="${COLORS.orange}"/>
        <rect x="${34 + i * 47}" y="68" width="12" height="3" rx="1" fill="${COLORS.text}" opacity="0.3"/>
        <rect x="${13 + i * 47}" y="76" width="36" height="3" rx="1" fill="#fed7aa"/>
        <rect x="${13 + i * 47}" y="76" width="25" height="3" rx="1" fill="${COLORS.orange}"/>
      `).join('')}
    `),
  },
  {
    id: 'dark_mode',
    name: 'Nền tối sang trọng',
    description: 'Dark background — cao cấp, hiện đại',
    tags: ['dark', 'premium'],
    config: { theme: 'dark_mode' },
    svgPreview: svgWrap(`
      <rect width="200" height="120" fill="#111827"/>
      <rect x="12" y="10" width="50" height="10" rx="2" fill="#f9fafb"/>
      <rect x="70" y="10" width="6" height="10" rx="1" fill="#4b5563"/>
      <rect x="78" y="10" width="6" height="10" rx="1" fill="#4b5563"/>
      <rect x="86" y="10" width="6" height="10" rx="1" fill="#4b5563"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="28" width="42" height="58" rx="4" fill="#1f2937" stroke="#374151" stroke-width="0.5"/>
        <rect x="${13 + i * 47}" y="31" width="36" height="24" rx="2" fill="#374151"/>
        <rect x="${13 + i * 47}" y="60" width="24" height="4" rx="1" fill="#e5e7eb"/>
        <rect x="${13 + i * 47}" y="67" width="18" height="5" rx="1" fill="#ef4444"/>
      `).join('')}
    `),
  },
  {
    id: 'rounded_cards',
    name: 'Bo tròn siêu mềm',
    description: 'Card bo góc lớn, shadow nhẹ nhàng',
    tags: ['soft', 'friendly'],
    config: { theme: 'rounded_cards' },
    svgPreview: svgWrap(`
      <rect x="12" y="10" width="50" height="10" rx="2" fill="${COLORS.accent}"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="28" width="42" height="58" rx="12" fill="${COLORS.card}" filter="url(#shadow)"/>
        <rect x="${13 + i * 47}" y="32" width="36" height="22" rx="8" fill="${COLORS.bg}"/>
        <rect x="${13 + i * 47}" y="60" width="24" height="4" rx="1" fill="${COLORS.text}"/>
        <rect x="${13 + i * 47}" y="67" width="18" height="5" rx="1" fill="#ef4444"/>
      `).join('')}
      <defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/></filter></defs>
    `),
  },
]

// ══════════════════════════════════════════
// Featured Products Templates
// ══════════════════════════════════════════
const featuredProductsTemplates = [
  {
    id: 'grid',
    name: 'Lưới cơ bản',
    description: 'Card sản phẩm xếp lưới đều',
    tags: ['classic', 'ecommerce'],
    config: { layoutStyle: 'grid', columns: 4 },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="70" height="8" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3].map(i => [0].map(j => `
        <rect x="${10 + i * 47}" y="${24 + j * 50}" width="42" height="44" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
        <rect x="${13 + i * 47}" y="${27 + j * 50}" width="36" height="18" rx="2" fill="${COLORS.bg}"/>
        <rect x="${13 + i * 47}" y="${49 + j * 50}" width="24" height="3" rx="1" fill="${COLORS.text}"/>
        <rect x="${13 + i * 47}" y="${55 + j * 50}" width="16" height="4" rx="1" fill="${COLORS.accent}"/>
      `).join('')).join('')}
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="74" width="42" height="44" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5" opacity="0.5"/>
        <rect x="${13 + i * 47}" y="77" width="36" height="18" rx="2" fill="${COLORS.bg}" opacity="0.5"/>
      `).join('')}
    `),
  },
  {
    id: 'carousel',
    name: 'Băng chuyền',
    description: 'Kéo lướt ngang, phong cách dynamic',
    tags: ['dynamic', 'modern'],
    config: { layoutStyle: 'carousel', slidesPerView: 4, autoplay: true },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="70" height="8" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="24" width="42" height="68" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
        <rect x="${13 + i * 47}" y="27" width="36" height="28" rx="2" fill="${COLORS.bg}"/>
        <rect x="${13 + i * 47}" y="60" width="24" height="3" rx="1" fill="${COLORS.text}"/>
        <rect x="${13 + i * 47}" y="66" width="16" height="4" rx="1" fill="${COLORS.accent}"/>
      `).join('')}
      <rect x="198" y="24" width="30" height="68" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5" opacity="0.3"/>
      <polygon points="85,108 95,108 90,115" fill="${COLORS.accent}" opacity="0.3"/>
      <circle cx="90" cy="108" r="3" fill="${COLORS.accent}" opacity="0.8"/>
      <circle cx="100" cy="108" r="3" fill="${COLORS.text}" opacity="0.3"/>
      <circle cx="110" cy="108" r="3" fill="${COLORS.text}" opacity="0.3"/>
    `),
  },
  {
    id: 'elegant',
    name: 'Sang trọng',
    description: 'Font serif, không viền — tối giản tinh tế',
    tags: ['premium', 'fashion'],
    config: { layoutStyle: 'elegant', columns: 4 },
    svgPreview: svgWrap(`
      <rect x="60" y="6" width="80" height="8" rx="2" fill="${COLORS.dark}"/>
      <rect x="75" y="16" width="50" height="3" rx="1" fill="${COLORS.text}" opacity="0.4"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="26" width="42" height="52" rx="0" fill="${COLORS.bg}"/>
        <rect x="${18 + i * 47}" y="82" width="26" height="3" rx="1" fill="${COLORS.dark}" opacity="0.7"/>
        <rect x="${22 + i * 47}" y="88" width="18" height="4" rx="1" fill="${COLORS.accent}"/>
      `).join('')}
      <line x1="10" y1="100" x2="190" y2="100" stroke="${COLORS.text}" stroke-width="0.3"/>
    `),
  },
  {
    id: 'minimal',
    name: 'Tối giản',
    description: 'Chỉ viền mỏng ngang, thông thoáng',
    tags: ['minimal', 'clean'],
    config: { layoutStyle: 'minimal', columns: 4 },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="50" height="6" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="22" width="42" height="30" rx="0" fill="${COLORS.bg}"/>
        <rect x="${10 + i * 47}" y="56" width="28" height="3" rx="1" fill="${COLORS.text}"/>
        <rect x="${10 + i * 47}" y="62" width="18" height="4" rx="1" fill="${COLORS.dark}"/>
        <line x1="${10 + i * 47}" y1="74" x2="${52 + i * 47}" y2="74" stroke="${COLORS.text}" stroke-width="0.5" opacity="0.3"/>
      `).join('')}
    `),
  },
]

// ══════════════════════════════════════════
// Categories Templates
// ══════════════════════════════════════════
const categoriesTemplates = [
  {
    id: 'grid',
    name: 'Lưới thẻ',
    description: 'Card ngang icon + tên danh mục',
    tags: ['classic'],
    config: { layoutStyle: 'grid' },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="60" height="8" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2].map(r => [0,1,2].map(c => `
        <rect x="${10 + c * 63}" y="${24 + r * 28}" width="58" height="22" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
        <circle cx="${22 + c * 63}" cy="${35 + r * 28}" r="6" fill="${COLORS.accent}" opacity="0.15"/>
        <rect x="${32 + c * 63}" y="${32 + r * 28}" width="28" height="4" rx="1" fill="${COLORS.text}"/>
      `).join('')).join('')}
    `),
  },
  {
    id: 'circle_icon',
    name: 'Icon tròn',
    description: 'Icon hình tròn, nhãn bên dưới',
    tags: ['pharmacy', 'modern'],
    config: { layoutStyle: 'circle_icon' },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="60" height="8" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3,4,5].map(i => `
        <circle cx="${28 + i * 28}" cy="45" r="12" fill="${COLORS.accent}" opacity="0.12"/>
        <circle cx="${28 + i * 28}" cy="45" r="6" fill="${COLORS.accent}" opacity="0.3"/>
        <rect x="${18 + i * 28}" y="62" width="20" height="3" rx="1" fill="${COLORS.text}" opacity="0.6"/>
      `).join('')}
    `),
  },
  {
    id: 'carousel',
    name: 'Carousel',
    description: 'Kéo lướt ngang các danh mục',
    tags: ['dynamic'],
    config: { layoutStyle: 'carousel' },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="60" height="8" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 50}" y="24" width="45" height="60" rx="6" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
        <rect x="${14 + i * 50}" y="28" width="37" height="30" rx="3" fill="${COLORS.bg}"/>
        <rect x="${18 + i * 50}" y="64" width="28" height="4" rx="1" fill="${COLORS.text}"/>
        <rect x="${22 + i * 50}" y="72" width="18" height="3" rx="1" fill="${COLORS.accent}" opacity="0.5"/>
      `).join('')}
      <circle cx="90" cy="95" r="3" fill="${COLORS.accent}"/>
      <circle cx="100" cy="95" r="3" fill="${COLORS.text}" opacity="0.3"/>
      <circle cx="110" cy="95" r="3" fill="${COLORS.text}" opacity="0.3"/>
    `),
  },
  {
    id: 'masonry',
    name: 'Bất đối xứng',
    description: 'Lưới so le kiểu Pinterest',
    tags: ['creative'],
    config: { layoutStyle: 'masonry' },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="60" height="8" rx="2" fill="${COLORS.dark}"/>
      <rect x="10" y="24" width="58" height="40" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
      <rect x="14" y="28" width="50" height="20" rx="2" fill="${COLORS.bg}"/>
      <rect x="14" y="52" width="30" height="4" rx="1" fill="${COLORS.text}"/>
      
      <rect x="72" y="24" width="58" height="55" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
      <rect x="76" y="28" width="50" height="30" rx="2" fill="${COLORS.bg}"/>
      <rect x="76" y="62" width="30" height="4" rx="1" fill="${COLORS.text}"/>
      
      <rect x="134" y="24" width="58" height="35" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
      <rect x="138" y="28" width="50" height="15" rx="2" fill="${COLORS.bg}"/>
      <rect x="138" y="47" width="30" height="4" rx="1" fill="${COLORS.text}"/>
      
      <rect x="10" y="70" width="58" height="45" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5" opacity="0.5"/>
      <rect x="134" y="65" width="58" height="50" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5" opacity="0.5"/>
    `),
  },
]

// ══════════════════════════════════════════
// New Arrivals Templates
// ══════════════════════════════════════════
const newArrivalsTemplates = [
  {
    id: 'grid',
    name: 'Lưới cơ bản',
    description: 'Grid đều, tương tự sản phẩm nổi bật',
    tags: ['classic'],
    config: { layoutStyle: 'grid' },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="60" height="8" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="24" width="42" height="50" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
        <rect x="${13 + i * 47}" y="27" width="36" height="22" rx="2" fill="${COLORS.bg}"/>
        <rect x="${13 + i * 47}" y="53" width="24" height="3" rx="1" fill="${COLORS.text}"/>
        <rect x="${13 + i * 47}" y="59" width="16" height="4" rx="1" fill="${COLORS.green}"/>
      `).join('')}
    `),
  },
  {
    id: 'carousel',
    name: 'Băng chuyền',
    description: 'Kéo ngang lướt sản phẩm mới',
    tags: ['dynamic'],
    config: { layoutStyle: 'carousel', autoplay: true },
    svgPreview: svgWrap(`
      <rect x="10" y="8" width="60" height="8" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="24" width="42" height="60" rx="4" fill="${COLORS.card}" stroke="#e2e8f0" stroke-width="0.5"/>
        <rect x="${13 + i * 47}" y="27" width="36" height="26" rx="2" fill="${COLORS.bg}"/>
        <rect x="${13 + i * 47}" y="58" width="24" height="3" rx="1" fill="${COLORS.text}"/>
        <rect x="${13 + i * 47}" y="64" width="16" height="4" rx="1" fill="${COLORS.green}"/>
      `).join('')}
      <circle cx="90" cy="96" r="3" fill="${COLORS.green}"/>
      <circle cx="100" cy="96" r="3" fill="${COLORS.text}" opacity="0.3"/>
      <circle cx="110" cy="96" r="3" fill="${COLORS.text}" opacity="0.3"/>
    `),
  },
  {
    id: 'lookbook',
    name: 'Lookbook',
    description: 'Phong cách thời trang, font in hoa',
    tags: ['fashion', 'premium'],
    config: { layoutStyle: 'lookbook' },
    svgPreview: svgWrap(`
      <rect x="60" y="5" width="80" height="6" rx="2" fill="${COLORS.dark}"/>
      ${[0,1,2,3].map(i => `
        <rect x="${10 + i * 47}" y="18" width="42" height="68" rx="0" fill="${COLORS.bg}"/>
        <rect x="${14 + i * 47}" y="90" width="34" height="3" rx="0" fill="${COLORS.dark}" opacity="0.8"/>
        <rect x="${18 + i * 47}" y="96" width="26" height="4" rx="0" fill="${COLORS.text}"/>
      `).join('')}
    `),
  },
]

// ══════════════════════════════════════════
// Banner Templates
// ══════════════════════════════════════════
const bannerTemplates = [
  {
    id: 'standard',
    name: 'Tiêu chuẩn',
    description: 'Slider ảnh cơ bản, chiều cao vừa phải',
    tags: ['classic'],
    config: { height: 'md', autoplay: true, interval: 4000 },
    svgPreview: svgWrap(`
      <rect x="5" y="5" width="190" height="90" rx="4" fill="#dbeafe"/>
      <rect x="70" y="35" width="60" height="8" rx="2" fill="${COLORS.dark}"/>
      <rect x="75" y="48" width="50" height="4" rx="1" fill="${COLORS.text}"/>
      <rect x="82" y="58" width="36" height="10" rx="3" fill="${COLORS.accent}"/>
      <circle cx="90" cy="104" r="4" fill="${COLORS.accent}"/>
      <circle cx="102" cy="104" r="3" fill="${COLORS.text}" opacity="0.3"/>
      <circle cx="112" cy="104" r="3" fill="${COLORS.text}" opacity="0.3"/>
    `),
  },
  {
    id: 'fullscreen',
    name: 'Toàn màn hình',
    description: 'Full height — ấn tượng ngay từ đầu',
    tags: ['hero', 'fashion'],
    config: { height: 'fullscreen', autoplay: true, interval: 5000 },
    svgPreview: svgWrap(`
      <rect width="200" height="120" fill="#0f172a"/>
      <rect x="40" y="30" width="120" height="10" rx="2" fill="#fff"/>
      <rect x="55" y="46" width="90" height="5" rx="1" fill="#94a3b8"/>
      <rect x="70" y="60" width="60" height="14" rx="4" fill="${COLORS.accent}"/>
      <rect x="76" y="64" width="48" height="6" rx="1" fill="#fff"/>
      <circle cx="90" cy="108" r="3" fill="#fff"/>
      <circle cx="100" cy="108" r="3" fill="#fff" opacity="0.3"/>
      <circle cx="110" cy="108" r="3" fill="#fff" opacity="0.3"/>
    `),
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Chiều cao nhỏ gọn, nhiều nội dung hơn',
    tags: ['pharmacy', 'utility'],
    config: { height: 'sm', autoplay: true, interval: 3000 },
    svgPreview: svgWrap(`
      <rect x="5" y="20" width="190" height="55" rx="6" fill="#dbeafe"/>
      <rect x="20" y="35" width="70" height="8" rx="2" fill="${COLORS.dark}"/>
      <rect x="20" y="48" width="45" height="4" rx="1" fill="${COLORS.text}"/>
      <rect x="20" y="56" width="40" height="10" rx="3" fill="${COLORS.accent}"/>
      <circle cx="90" cy="86" r="3" fill="${COLORS.accent}"/>
      <circle cx="100" cy="86" r="3" fill="${COLORS.text}" opacity="0.3"/>
    `),
  },
]

// ══════════════════════════════════════════
// Export Registry
// ══════════════════════════════════════════
export const sectionTemplates = {
  flash_sale: flashSaleTemplates,
  featured_products: featuredProductsTemplates,
  categories: categoriesTemplates,
  new_arrivals: newArrivalsTemplates,
  banner: bannerTemplates,
}

/**
 * Get templates for a section type.
 * Returns empty array if no templates defined (fallback to form inputs).
 */
export function getTemplatesForSection(sectionType) {
  return sectionTemplates[sectionType] || []
}

/**
 * Check if a section type has visual templates.
 */
export function hasVisualTemplates(sectionType) {
  return (sectionTemplates[sectionType] || []).length > 0
}
