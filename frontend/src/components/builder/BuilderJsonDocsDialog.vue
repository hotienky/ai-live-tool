<template>
  <Teleport to="body">
    <div v-if="modelValue" class="jdocs-overlay" @click.self="$emit('update:modelValue', false)">
      <div class="jdocs-dialog">
        <!-- Header -->
        <div class="jdocs-header">
          <div class="jdocs-header__title">
            <BookOpen :size="18" />
            <span>Tài liệu JSON Template — Layout Config</span>
            <span class="jdocs-badge">v2</span>
          </div>
          <div class="jdocs-header__actions">
            <button class="jdocs-btn-download" @click="downloadSchemaExample" title="Tải xuống file JSON mẫu đầy đủ">
              <Download :size="14" /> Tải JSON mẫu
            </button>
            <button class="jdocs-close" @click="$emit('update:modelValue', false)"><X :size="18" /></button>
          </div>
        </div>

        <div class="jdocs-body">
          <!-- Sidebar nav -->
          <nav class="jdocs-nav">
            <button v-for="sec in sections" :key="sec.id"
              class="jdocs-nav__item" :class="{ active: activeSection === sec.id }"
              @click="activeSection = sec.id">
              <component :is="sec.icon" :size="14" />
              {{ sec.label }}
            </button>
          </nav>

          <!-- Content -->
          <div class="jdocs-content">

            <!-- OVERVIEW -->
            <section v-if="activeSection === 'overview'" class="jdocs-section">
              <h2>Tổng quan</h2>
              <p>File JSON template chứa <strong>toàn bộ cấu hình</strong> của một trang Storefront — bao gồm layout sections, header, footer, promo bar, và tất cả page configs. Bạn có thể <strong>export → chỉnh sửa → import</strong> để setup nhanh hoặc sao chép config giữa các store.</p>

              <div class="jdocs-callout jdocs-callout--info">
                <Info :size="16" />
                <span>Sau khi import, nhấn <strong>Xuất bản</strong> để áp dụng lên storefront. Import chỉ cập nhật editor, chưa lưu vào server.</span>
              </div>

              <h3>Cấu trúc top-level</h3>
              <div class="jdocs-code">
<pre>{{ overviewSchema }}</pre>
              </div>

              <h3>Quy tắc validation</h3>
              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Bắt buộc</th><th>Kiểu</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>_schema</code></td><td>Không</td><td>string</td><td>Phải là <code>"storefront-layout-template"</code> nếu có (v1 legacy: <code>"storefront-layout-template-v1"</code>)</td></tr>
                  <tr><td><code>version</code></td><td>Không</td><td>number</td><td>Schema version — dùng để migrate. Hiện tại: <code>2</code></td></tr>
                  <tr><td><code>theme</code></td><td>Không</td><td>object</td><td>Hệ màu sắc trung tâm của toàn site (thay thế themeConfig legacy)</td></tr>
                  <tr><td><code>globalSettings</code></td><td>Không</td><td>object</td><td>Thiết lập layout toàn cục: container, spacing, font...</td></tr>
                  <tr><td><code>sections</code></td><td><span class="jdocs-req">✓ Có</span></td><td>array</td><td>Mảng các section objects</td></tr>
                  <tr><td><code>headerConfig</code></td><td>Không</td><td>object</td><td>Config header, merge với defaults nếu thiếu field</td></tr>
                  <tr><td><code>footerConfig</code></td><td>Không</td><td>object</td><td>Config footer, <code>columns</code> phải là array</td></tr>
                  <tr><td><code>promoConfig</code></td><td>Không</td><td>object</td><td>Config promo bar</td></tr>
                  <tr><td><code>pages</code></td><td>Không</td><td>object</td><td>Bật/tắt các route page</td></tr>
                  <tr><td><code>pageConfigs</code></td><td>Không</td><td>object</td><td>Config chi tiết từng trang sản phẩm, checkout...</td></tr>
                  <tr><td><code>template</code></td><td>Không</td><td>string</td><td>Template preset: <code>full_store</code>, <code>pharmacy</code>, <code>fashion</code>...</td></tr>
                  <tr><td><code>customCss</code></td><td>Không</td><td>string</td><td>CSS tùy chỉnh được inject vào storefront</td></tr>
                </tbody>
              </table>
            </section>

            <!-- SECTIONS -->
            <section v-if="activeSection === 'sections'" class="jdocs-section">
              <h2>sections <span class="jdocs-type">array&lt;SectionObject&gt;</span></h2>
              <p>Mảng các section hiển thị trên trang. Thứ tự trong mảng tương ứng với thứ tự hiển thị (field <code>order</code> sẽ ghi đè nếu có).</p>

              <h3>SectionObject schema</h3>
              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Kiểu</th><th>Mặc định</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>id</code></td><td>string</td><td>auto-generated</td><td>ID duy nhất của section, tự sinh nếu bỏ trống</td></tr>
                  <tr><td><code>type</code></td><td><span class="jdocs-req">string*</span></td><td>—</td><td>Loại section (xem danh sách bên dưới)</td></tr>
                  <tr><td><code>enabled</code></td><td>boolean</td><td>true</td><td>Ẩn/hiện section trên storefront</td></tr>
                  <tr><td><code>order</code></td><td>number</td><td>index</td><td>Thứ tự sắp xếp (số nhỏ hơn = hiển thị trên)</td></tr>
                  <tr><td><code>params</code></td><td>object</td><td>{}</td><td>Các tham số cấu hình của section (khác nhau theo type)</td></tr>
                  <tr><td><code>tabletParams</code></td><td>object</td><td>{}</td><td>Override params cho tablet (≤1024px)</td></tr>
                  <tr><td><code>mobileParams</code></td><td>object</td><td>{}</td><td>Override params cho mobile (≤768px)</td></tr>
                  <tr><td><code>content</code></td><td>array</td><td>[]</td><td>Nội dung dynamic (dùng cho banner slides, blocks...)</td></tr>
                </tbody>
              </table>

              <h3>Danh sách section types</h3>
              <div class="jdocs-section-grid">
                <div v-for="st in sectionTypes" :key="st.type" class="jdocs-section-card">
                  <div class="jdocs-section-card__type"><code>{{ st.type }}</code></div>
                  <div class="jdocs-section-card__label">{{ st.label }}</div>
                  <div class="jdocs-section-card__params" v-if="st.params">
                    <span v-for="p in st.params" :key="p" class="jdocs-param-tag">{{ p }}</span>
                  </div>
                </div>
              </div>

              <h3>Ví dụ section banner</h3>
              <div class="jdocs-code"><pre>{{ bannerExample }}</pre></div>
            </section>

            <!-- HEADER CONFIG -->
            <section v-if="activeSection === 'header'" class="jdocs-section">
              <h2>headerConfig <span class="jdocs-type">object</span></h2>
              <p>Cấu hình thanh header: logo, nav menu, announcement bar, search, sticky...</p>

              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Kiểu</th><th>Mặc định</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>logoPosition</code></td><td>string</td><td><code>"left"</code></td><td><code>"left"</code> hoặc <code>"center"</code></td></tr>
                  <tr><td><code>maxNavLinks</code></td><td>number</td><td><code>5</code></td><td>Số link tối đa hiển thị trước khi ẩn vào dropdown "Thêm" (3–10)</td></tr>
                  <tr><td><code>showSearch</code></td><td>boolean</td><td><code>true</code></td><td>Hiện thanh tìm kiếm sản phẩm</td></tr>
                  <tr><td><code>sticky</code></td><td>boolean</td><td><code>true</code></td><td>Header cố định khi cuộn trang</td></tr>
                  <tr><td><code>showThemeToggle</code></td><td>boolean</td><td><code>true</code></td><td>Hiện nút chuyển Dark/Light mode</td></tr>
                  <tr><td><code>showAnnouncement</code></td><td>boolean</td><td><code>false</code></td><td>Hiện thanh thông báo phía trên header</td></tr>
                  <tr><td><code>announcementText</code></td><td>string</td><td><code>""</code></td><td>Nội dung thông báo</td></tr>
                  <tr><td><code>announcementLink</code></td><td>string</td><td><code>""</code></td><td>URL khi click vào thông báo (tùy chọn)</td></tr>
                  <tr><td><code>announcementBg</code></td><td>string (hex)</td><td>theme accent</td><td>Màu nền announcement bar, VD: <code>"#1b51a3"</code></td></tr>
                  <tr><td><code>announcementColor</code></td><td>string (hex)</td><td><code>"#fff"</code></td><td>Màu chữ announcement bar</td></tr>
                  <tr><td><code>topbarLinks</code></td><td>array</td><td><code>[]</code></td><td>Các link tiện ích (Hotline, App...) hiển thị bên phải announcement bar</td></tr>
                  <tr><td><code>navLinks</code></td><td>array</td><td><code>[]</code></td><td>Danh sách link điều hướng — đây là nguồn dữ liệu chính cho menu header</td></tr>
                  <tr><td><code>translations</code></td><td>object</td><td><code>{}</code></td><td>Dịch đa ngôn ngữ: <code>{"en": {"announcementText": "..."}}</code></td></tr>
                </tbody>
              </table>

              <h3>topbarLinks item</h3>
              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Kiểu</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>label</code></td><td>string</td><td>Tên hiển thị, VD: <code>"Hotline 1800 6821"</code></td></tr>
                  <tr><td><code>url</code></td><td>string</td><td>URL, VD: <code>"tel:18006821"</code> hoặc <code>"/stores"</code></td></tr>
                </tbody>
              </table>

              <h3>navLinks item</h3>
              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Kiểu</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>name</code></td><td>string</td><td>Tên hiển thị trên menu</td></tr>
                  <tr><td><code>url</code></td><td>string</td><td>Đường dẫn, VD: <code>"/"</code>, <code>"/products?category=thuoc"</code></td></tr>
                  <tr><td><code>type</code></td><td>string</td><td><code>"single"</code> hoặc <code>"collection"</code> (dropdown)</td></tr>
                  <tr><td><code>target</code></td><td>string</td><td><code>"_self"</code> hoặc <code>"_blank"</code></td></tr>
                  <tr><td><code>sort</code></td><td>number</td><td>Thứ tự sắp xếp</td></tr>
                  <tr><td><code>translations</code></td><td>object</td><td>Dịch tên theo ngôn ngữ: <code>{"en": {"name": "Home"}}</code></td></tr>
                </tbody>
              </table>

              <h3>Ví dụ headerConfig</h3>
              <div class="jdocs-code"><pre>{{ headerExample }}</pre></div>
            </section>

            <!-- FOOTER CONFIG -->
            <section v-if="activeSection === 'footer'" class="jdocs-section">
              <h2>footerConfig <span class="jdocs-type">object</span></h2>
              <p>Cấu hình footer: cột link, social, payment methods, badges, màu sắc...</p>

              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Kiểu</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>columns</code></td><td><span class="jdocs-req">array*</span></td><td>Các cột footer (xem FooterColumn bên dưới)</td></tr>
                  <tr><td><code>social</code></td><td>array</td><td>Danh sách social links</td></tr>
                  <tr><td><code>paymentMethods</code></td><td>array&lt;string&gt;</td><td>Phương thức thanh toán: <code>["cod","bank","momo","vnpay","zalopay","visa","mastercard","jcb","paypal"]</code></td></tr>
                  <tr><td><code>badges</code></td><td>array</td><td>Chứng nhận/huy hiệu (logo BVSS, DMCA...)</td></tr>
                  <tr><td><code>copyrightText</code></td><td>string</td><td>Text bản quyền, VD: <code>"© 2024 Pharmacity"</code></td></tr>
                  <tr><td><code>legalText</code></td><td>string</td><td>Nội dung pháp lý (hỗ trợ xuống dòng bằng \n)</td></tr>
                  <tr><td><code>bgColor</code></td><td>string (hex)</td><td>Màu nền footer</td></tr>
                  <tr><td><code>textColor</code></td><td>string (hex)</td><td>Màu chữ nội dung</td></tr>
                  <tr><td><code>headingColor</code></td><td>string (hex)</td><td>Màu tiêu đề các cột</td></tr>
                  <tr><td><code>translations</code></td><td>object</td><td>Dịch đa ngôn ngữ</td></tr>
                </tbody>
              </table>

              <h3>FooterColumn schema</h3>
              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Kiểu</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>title</code></td><td>string</td><td>Tiêu đề cột</td></tr>
                  <tr><td><code>type</code></td><td>string</td><td><code>"links"</code> | <code>"contact"</code> | <code>"text"</code></td></tr>
                  <tr><td><code>links</code></td><td>array</td><td>Khi <code>type="links"</code>: <code>[{"label":"Giới thiệu","url":"/page/gioi-thieu"}]</code></td></tr>
                  <tr><td><code>items</code></td><td>array</td><td>Khi <code>type="contact"</code>: <code>[{"icon":"phone","label":"Hotline","value":"1800 xxx"}]</code></td></tr>
                  <tr><td><code>content</code></td><td>string</td><td>Khi <code>type="text"</code>: nội dung HTML/text tự do</td></tr>
                </tbody>
              </table>

              <h3>Social item</h3>
              <table class="jdocs-table">
                <thead><tr><th>platform</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr v-for="sp in socialPlatforms" :key="sp"><td><code>{{ sp }}</code></td><td>URL trang {{ sp }}</td></tr>
                </tbody>
              </table>

              <h3>Ví dụ footerConfig</h3>
              <div class="jdocs-code"><pre>{{ footerExample }}</pre></div>
            </section>

            <!-- PROMO CONFIG -->
            <section v-if="activeSection === 'promo'" class="jdocs-section">
              <h2>promoConfig <span class="jdocs-type">object</span></h2>
              <p>Cấu hình thanh Promo Bar hiển thị phía trên cùng trang (trên header).</p>

              <table class="jdocs-table">
                <thead><tr><th>Field</th><th>Kiểu</th><th>Mặc định</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>enabled</code></td><td>boolean</td><td><code>true</code></td><td>Bật/tắt promo bar</td></tr>
                  <tr><td><code>text</code></td><td>string</td><td>"Miễn phí..."</td><td>Nội dung thông báo khuyến mãi</td></tr>
                  <tr><td><code>link</code></td><td>string</td><td><code>"/products"</code></td><td>URL khi click CTA</td></tr>
                  <tr><td><code>ctaText</code></td><td>string</td><td><code>"Mua sắm"</code></td><td>Text nút CTA (Call To Action)</td></tr>
                  <tr><td><code>bgColor</code></td><td>string (hex)</td><td><code>"#7c3aed"</code></td><td>Màu nền promo bar — ghi đè gradient mặc định</td></tr>
                  <tr><td><code>textColor</code></td><td>string (hex)</td><td><code>"#ffffff"</code></td><td>Màu chữ promo bar</td></tr>
                  <tr><td><code>fontSize</code></td><td>string (css)</td><td><code>"13px"</code></td><td>Kích thước chữ: <code>"12px"</code>, <code>"13px"</code>, <code>"14px"</code>, <code>"15px"</code></td></tr>
                  <tr><td><code>dismissible</code></td><td>boolean</td><td><code>true</code></td><td>Cho phép user đóng promo bar (hiện nút X)</td></tr>
                </tbody>
              </table>

              <h3>Ví dụ promoConfig</h3>
              <div class="jdocs-code"><pre>{{ promoExample }}</pre></div>
            </section>

            <!-- PAGES -->
            <section v-if="activeSection === 'pages'" class="jdocs-section">
              <h2>pages <span class="jdocs-type">object</span></h2>
              <p>Bật/tắt các route page trên storefront. Khi tắt (<code>false</code>), route đó sẽ bị redirect về trang chủ.</p>

              <table class="jdocs-table">
                <thead><tr><th>Key</th><th>Mặc định</th><th>Mô tả</th></tr></thead>
                <tbody>
                  <tr><td><code>cart</code></td><td><code>true</code></td><td>Trang giỏ hàng <code>/cart</code></td></tr>
                  <tr><td><code>account</code></td><td><code>true</code></td><td>Trang tài khoản <code>/account</code></td></tr>
                  <tr><td><code>auth</code></td><td><code>true</code></td><td>Trang đăng nhập/đăng ký <code>/auth</code></td></tr>
                  <tr><td><code>order_tracking</code></td><td><code>true</code></td><td>Trang tra cứu đơn hàng <code>/order-tracking</code></td></tr>
                  <tr><td><code>products</code></td><td><code>true</code></td><td>Trang danh sách sản phẩm <code>/products</code></td></tr>
                </tbody>
              </table>

              <h3>pageConfigs</h3>
              <p>Config chi tiết cho từng trang hệ thống:</p>

              <table class="jdocs-table">
                <thead><tr><th>Key</th><th>Fields quan trọng</th></tr></thead>
                <tbody>
                  <tr>
                    <td><code>products</code></td>
                    <td>
                      <code>sidebarPosition</code> ("left"/"right"),
                      <code>gridColumns</code> (2-6),
                      <code>itemsPerPage</code> (6-48),
                      <code>showFilters</code> ({category, brand, price})
                    </td>
                  </tr>
                  <tr>
                    <td><code>productDetail</code></td>
                    <td>
                      <code>galleryStyle</code> ("thumbnails"/"main-only"),
                      <code>layoutRatio</code> ("50-50"/"40-60"/"60-40"),
                      <code>showRelatedProducts</code>,
                      <code>showReviews</code>
                    </td>
                  </tr>
                  <tr>
                    <td><code>checkout</code></td>
                    <td><code>showCoupon</code>, <code>showNotes</code>, <code>showSteps</code>, <code>layout</code> ("two-column"/"single")</td>
                  </tr>
                  <tr>
                    <td><code>blog</code></td>
                    <td><code>postsPerPage</code>, <code>showSidebar</code>, <code>showTags</code>, <code>showAuthor</code></td>
                  </tr>
                </tbody>
              </table>
            </section>

            <!-- EXAMPLE FULL -->
            <section v-if="activeSection === 'example'" class="jdocs-section">
              <h2>File JSON mẫu đầy đủ</h2>
              <div class="jdocs-callout jdocs-callout--success">
                <Download :size="16" />
                <span>Nhấn <strong>"Tải JSON mẫu"</strong> ở góc trên phải để tải file JSON mẫu Pharmacity đầy đủ.</span>
              </div>

              <h3>Checklist trước khi import</h3>
              <ul class="jdocs-checklist">
                <li><span class="check">✓</span> File là JSON hợp lệ (dùng jsonlint.com để kiểm tra)</li>
                <li><span class="check">✓</span> Có trường <code>sections</code> là array</li>
                <li><span class="check">✓</span> Mỗi section có <code>type</code> hợp lệ (xem danh sách trong tab Sections)</li>
                <li><span class="check">✓</span> <code>footerConfig.columns</code> là array (không phải số)</li>
                <li><span class="check">✓</span> Màu sắc là hex string hợp lệ: <code>"#1b51a3"</code> (không thiếu dấu #)</li>
                <li><span class="warn">!</span> Sau khi import, nhớ nhấn <strong>Xuất bản</strong> để lưu vào server</li>
                <li><span class="warn">!</span> Import sẽ <strong>ghi đè</strong> toàn bộ config hiện tại trong editor (có thể Undo)</li>
              </ul>

              <h3>Cấu trúc file hoàn chỉnh</h3>
              <div class="jdocs-code jdocs-code--full"><pre>{{ fullExample }}</pre></div>
            </section>

          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { BookOpen, X, Download, Info } from 'lucide-vue-next'

defineProps({ modelValue: { type: Boolean, default: false } })
defineEmits(['update:modelValue'])

const activeSection = ref('overview')

const sections = [
  { id: 'overview', label: 'Tổng quan', icon: BookOpen },
  { id: 'sections', label: 'sections[]', icon: BookOpen },
  { id: 'header', label: 'headerConfig', icon: BookOpen },
  { id: 'footer', label: 'footerConfig', icon: BookOpen },
  { id: 'promo', label: 'promoConfig', icon: BookOpen },
  { id: 'pages', label: 'pages & pageConfigs', icon: BookOpen },
  { id: 'example', label: 'File mẫu & Checklist', icon: Download },
]

const sectionTypes = [
  { type: 'banner', label: 'Banner/Slider', params: ['autoplay', 'interval', 'height', 'content[]'] },
  { type: 'categories', label: 'Danh mục sản phẩm', params: ['columns', 'showCount', 'layoutStyle'] },
  { type: 'flash_sale', label: 'Flash Sale', params: ['showTimer', 'showProgress', 'count', 'columns'] },
  { type: 'featured_products', label: 'Sản phẩm nổi bật', params: ['title', 'count', 'columns', 'filterCategory'] },
  { type: 'new_arrivals', label: 'Hàng mới về', params: ['title', 'count', 'columns'] },
  { type: 'cms_pages', label: 'Trang CMS / Bài viết', params: ['title', 'count', 'tag'] },
  { type: 'testimonials', label: 'Đánh giá khách hàng', params: ['title', 'autoplay'] },
  { type: 'faq', label: 'FAQ', params: ['title', 'content[]'] },
  { type: 'blog', label: 'Blog posts', params: ['title', 'count', 'tag'] },
  { type: 'newsletter', label: 'Newsletter signup', params: ['title', 'subtitle', 'placeholder'] },
  { type: 'brands_slider', label: 'Logo thương hiệu', params: ['title', 'autoplay', 'speed'] },
  { type: 'trust_badges', label: 'Trust badges', params: ['items[]'] },
  { type: 'image_gallery', label: 'Thư viện ảnh', params: ['columns', 'content[]'] },
  { type: 'video_embed', label: 'Video nhúng', params: ['url', 'autoplay', 'loop'] },
  { type: 'text_block', label: 'Khối văn bản', params: ['content', 'alignment'] },
  { type: 'grid', label: 'Grid tùy chỉnh', params: ['columns', 'content[]'] },
  { type: 'social_feed', label: 'Social feed', params: ['platform', 'handle'] },
  { type: 'system_page_content', label: 'Nội dung trang hệ thống', params: ['title'] },
]

const socialPlatforms = ['facebook', 'instagram', 'tiktok', 'youtube', 'zalo', 'twitter', 'linkedin', 'pinterest']

const overviewSchema = `{
  "_schema":      "storefront-layout-template",  // nhận dạng file
  "_version":     2,                             // version schema trong metadata
  "_exported_at": "2026-01-01T00:00:00.000Z",   // timestamp export
  "_page":        "home",                        // trang đã export

  "version":        2,            // dùng để migrate khi upgrade schema
  "template":       "pharmacy",   // tùy chọn — preset template
  "customCss":      "",           // tùy chọn — CSS tùy chỉnh

  "theme":          { ... },      // tùy chọn — hệ màu sắc trung tâm
  "globalSettings": { ... },      // tùy chọn — layout toàn cục (container, font...)
  "sections":       [ ... ],      // bắt buộc — mảng sections
  "headerConfig":   { ... },      // tùy chọn — config header
  "footerConfig":   { ... },      // tùy chọn — config footer
  "promoConfig":    { ... },      // tùy chọn — config promo bar
  "pages":          { ... },      // tùy chọn — bật/tắt routes
  "pageConfigs":    { ... }       // tùy chọn — config từng trang
}`

const bannerExample = `{
  "id": "section-banner-1",
  "type": "banner",
  "enabled": true,
  "order": 0,
  "params": {
    "autoplay": true,
    "interval": 4000,
    "height": "md",
    "showDots": true,
    "showArrows": true
  },
  "content": [
    {
      "imageUrl": "/uploads/banner1.jpg",
      "title": "Chào mừng đến Pharmacity",
      "subtitle": "Thuốc chính hãng, giao nhanh 2h",
      "ctaText": "Khám phá ngay",
      "ctaUrl": "/products"
    }
  ]
}`

const headerExample = `{
  "logoPosition": "left",
  "maxNavLinks": 8,
  "showSearch": false,
  "sticky": true,
  "showThemeToggle": false,
  "showAnnouncement": true,
  "announcementText": "Miễn phí vận chuyển từ 500.000đ!",
  "announcementBg": "#ffffff",
  "announcementColor": "#1b51a3",
  "announcementLink": "/promotions",
  "topbarLinks": [
    { "label": "Tải ứng dụng", "url": "#" },
    { "label": "Hotline 1800 6821", "url": "tel:18006821" },
    { "label": "Hệ thống nhà thuốc", "url": "/stores" }
  ],
  "navLinks": [
    { "name": "Trang Chủ", "url": "/", "type": "single", "sort": 0 },
    { "name": "Thuốc", "url": "/products?category=thuoc", "sort": 1 },
    { "name": "Thực phẩm BVSK", "url": "/products?category=thuc-pham-chuc-nang", "sort": 2 }
  ]
}`

const footerExample = `{
  "bgColor": "#1b51a3",
  "textColor": "#ffffff",
  "headingColor": "#ffffff",
  "copyrightText": "© 2024 Pharmacity. Bảo lưu mọi quyền.",
  "legalText": "Giấy phép kinh doanh số 123/GP\\nBộ Y tế cấp phép",
  "columns": [
    {
      "title": "Về Pharmacity",
      "type": "links",
      "links": [
        { "label": "Giới thiệu", "url": "/page/gioi-thieu" },
        { "label": "Chính sách bảo mật", "url": "/page/chinh-sach-bao-mat" }
      ]
    },
    {
      "title": "Liên hệ",
      "type": "contact",
      "items": [
        { "icon": "phone", "label": "Hotline", "value": "1800 6821" },
        { "icon": "email", "label": "Email", "value": "support@pharmacity.vn" }
      ]
    }
  ],
  "social": [
    { "platform": "facebook", "url": "https://facebook.com/pharmacity" },
    { "platform": "zalo", "url": "https://zalo.me/pharmacity" }
  ],
  "paymentMethods": ["cod", "bank", "momo", "vnpay"],
  "badges": [
    { "imageUrl": "/uploads/bvss-badge.png", "title": "Đã đăng ký Bộ Y tế" }
  ]
}`

const promoExample = `{
  "enabled": true,
  "text": "🎉 Giảm 20% toàn bộ thuốc vitamin — Áp dụng đến 31/12",
  "link": "/promotions",
  "ctaText": "Xem ngay",
  "bgColor": "#1b51a3",
  "textColor": "#ffffff",
  "fontSize": "13px",
  "dismissible": true
}`

const fullExample = `{
  "_schema": "storefront-layout-template",
  "_version": 2,
  "_exported_at": "2026-01-01T00:00:00.000Z",
  "_page": "home",

  "version": 2,
  "template": "pharmacy",
  "customCss": "",

  "theme": {
    "primary": "#1b51a3", "secondary": "#f97316", "accent": "#10b981",
    "background": "#f9fafb", "text": "#1f2937", "textMuted": "#6b7280"
  },
  "globalSettings": {
    "containerWidth": "1200px", "sectionGap": "48px", "borderRadius": "8px",
    "fontFamily": "'Inter', sans-serif", "animationsEnabled": true
  },

  "sections": [
    { "type": "banner",   "enabled": true, "order": 0, "params": { "autoplay": true } },
    { "type": "categories","enabled": true, "order": 1, "params": { "columns": 6 } },
    { "type": "flash_sale","enabled": true, "order": 2, "params": { "showTimer": true } },
    { "type": "featured_products","enabled":true,"order":3,"params":{"count":8} }
  ],

  "headerConfig": {
    "logoPosition": "left",
    "maxNavLinks": 8,
    "showSearch": false,
    "sticky": true,
    "showAnnouncement": true,
    "announcementText": "Miễn phí vận chuyển từ 500.000đ!",
    "announcementBg": "#1b51a3",
    "announcementColor": "#ffffff",
    "navLinks": [
      { "name": "Trang Chủ", "url": "/" },
      { "name": "Thuốc", "url": "/products?category=thuoc" }
    ]
  },

  "footerConfig": {
    "bgColor": "#1b51a3",
    "columns": [
      { "title": "Về chúng tôi", "type": "links", "links": [
        { "label": "Giới thiệu", "url": "/page/gioi-thieu" }
      ]}
    ],
    "paymentMethods": ["cod", "bank", "momo"]
  },

  "promoConfig": {
    "enabled": true,
    "text": "Miễn phí vận chuyển cho đơn từ 500K!",
    "bgColor": "#7c3aed",
    "textColor": "#fff",
    "dismissible": true
  },

  "pages": {
    "cart": true, "account": true, "auth": true,
    "order_tracking": true, "products": true
  },

  "pageConfigs": {
    "products": {
      "gridColumns": 4,
      "itemsPerPage": 12,
      "sidebarPosition": "left"
    }
  }
}`

// Sample JSON download
function downloadSchemaExample() {
  const sample = {
    _schema: 'storefront-layout-template',
    _version: 2,
    _exported_at: new Date().toISOString(),
    _page: 'home',
    version: 2,
    template: 'pharmacy',
    customCss: '',
    theme: {
      primary: '#1b51a3', secondary: '#f97316', accent: '#10b981',
      background: '#f9fafb', surface: '#ffffff', border: '#e5e7eb',
      text: '#1f2937', textMuted: '#6b7280', danger: '#ef4444',
      warning: '#f59e0b', success: '#10b981', mode: 'light',
    },
    globalSettings: {
      containerWidth: '1200px', gridGap: '16px', sectionGap: '48px',
      borderRadius: '8px', fontFamily: "'Inter', sans-serif",
      headingFont: "'Inter', sans-serif", buttonStyle: 'rounded',
      cardShadow: 'sm', imageAspectRatio: '1/1', animationsEnabled: true,
    },
    sections: [
      { id: 'banner-1', type: 'banner', enabled: true, order: 0, params: { autoplay: true, interval: 4000, height: 'md' }, content: [] },
      { id: 'cats-1', type: 'categories', enabled: true, order: 1, params: { columns: 6, showCount: false } },
      { id: 'flash-1', type: 'flash_sale', enabled: true, order: 2, params: { showTimer: true, showProgress: true, count: 8, columns: 4 } },
      { id: 'feat-1', type: 'featured_products', enabled: true, order: 3, params: { title: 'Sản phẩm nổi bật', count: 8, columns: 4 } },
    ],
    headerConfig: {
      logoPosition: 'left', maxNavLinks: 8, showSearch: false, sticky: true,
      showThemeToggle: false, showAnnouncement: true,
      announcementText: 'Miễn phí vận chuyển cho đơn từ 500.000đ!',
      announcementBg: '#ffffff', announcementColor: '#1b51a3', announcementLink: '/promotions',
      topbarLinks: [
        { label: 'Tải ứng dụng', url: '#' },
        { label: 'Hotline 1800 6821', url: 'tel:18006821' },
        { label: 'Hệ thống nhà thuốc', url: '/stores' },
      ],
      navLinks: [
        { name: 'Trang Chủ', url: '/', type: 'single', sort: 0 },
        { name: 'Thuốc', url: '/products?category=thuoc', type: 'single', sort: 1 },
        { name: 'Thực phẩm BVSK', url: '/products?category=thuc-pham-chuc-nang', type: 'single', sort: 2 },
        { name: 'Mẹ và bé', url: '/products?category=me-va-be', type: 'single', sort: 3 },
        { name: 'Nhãn hàng Pharmacity', url: '/products?brand=pharmacity', type: 'single', sort: 4 },
        { name: 'Khuyến mãi', url: '/promotions', type: 'single', sort: 5 },
      ],
    },
    footerConfig: {
      bgColor: '#1b51a3', textColor: '#ffffff', headingColor: '#ffffff',
      copyrightText: '© 2024 Pharmacity. Bảo lưu mọi quyền.',
      legalText: '',
      columns: [
        { title: 'Về Pharmacity', type: 'links', links: [
          { label: 'Giới thiệu', url: '/page/gioi-thieu' },
          { label: 'Chính sách bảo mật', url: '/page/chinh-sach-bao-mat' },
          { label: 'Chính sách đổi trả', url: '/page/doi-tra' },
        ]},
        { title: 'Hỗ trợ', type: 'links', links: [
          { label: 'Tra cứu đơn hàng', url: '/order-tracking' },
          { label: 'Câu hỏi thường gặp', url: '/page/faq' },
        ]},
        { title: 'Liên hệ', type: 'contact', items: [
          { icon: 'phone', label: 'Hotline', value: '1800 6821' },
          { icon: 'email', label: 'Email', value: 'support@pharmacity.vn' },
        ]},
      ],
      social: [
        { platform: 'facebook', url: 'https://facebook.com/pharmacity' },
        { platform: 'zalo', url: 'https://zalo.me/pharmacity' },
      ],
      paymentMethods: ['cod', 'bank', 'momo', 'vnpay'],
      badges: [],
    },
    promoConfig: {
      enabled: false, text: 'Miễn phí vận chuyển cho đơn từ 500K!',
      link: '/products', ctaText: 'Mua sắm',
      bgColor: '#1b51a3', textColor: '#ffffff', fontSize: '13px', dismissible: true,
    },
    pages: { cart: true, account: true, auth: true, order_tracking: true, products: true },
    pageConfigs: {
      products: { sidebarPosition: 'left', gridColumns: 4, itemsPerPage: 12, showFilters: { category: true, brand: true, price: true } },
      productDetail: { galleryStyle: 'thumbnails', layoutRatio: '50-50', showRelatedProducts: true, showReviews: true, relatedCount: 6 },
      checkout: { showCoupon: true, showNotes: true, showSteps: true, layout: 'two-column' },
    },
  }
  const str = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sample, null, 2))
  const a = document.createElement('a')
  a.setAttribute('href', str)
  a.setAttribute('download', 'layout_template_sample.json')
  document.body.appendChild(a)
  a.click()
  a.remove()
}
</script>

<style scoped>
.jdocs-overlay {
  position: fixed; inset: 0; z-index: 200000;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.jdocs-dialog {
  width: 960px; max-width: 95vw; max-height: 90vh;
  background: #fff; border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  display: flex; flex-direction: column; overflow: hidden;
  animation: dialogIn 0.25s cubic-bezier(0.16,1,0.3,1);
}
@keyframes dialogIn {
  from { opacity:0; transform:scale(0.96) translateY(16px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}

/* Header */
.jdocs-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg,#f8f9ff,#fff); flex-shrink: 0;
}
.jdocs-header__title {
  display: flex; align-items: center; gap: 10px;
  font-size: 16px; font-weight: 700; color: #1e293b;
}
.jdocs-badge {
  background: #6366f1; color: #fff; font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 10px;
}
.jdocs-header__actions { display: flex; align-items: center; gap: 8px; }
.jdocs-btn-download {
  display: flex; align-items: center; gap: 6px;
  background: #6366f1; color: #fff; border: none; border-radius: 8px;
  padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: 0.2s;
}
.jdocs-btn-download:hover { background: #4f46e5; }
.jdocs-close {
  background: none; border: none; color: #94a3b8; padding: 6px;
  border-radius: 8px; cursor: pointer; transition: 0.2s;
  display: flex; align-items: center;
}
.jdocs-close:hover { background: #f1f5f9; color: #ef4444; }

/* Body layout */
.jdocs-body {
  display: flex; flex: 1; overflow: hidden;
}

/* Sidebar nav */
.jdocs-nav {
  width: 180px; flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  padding: 12px 8px; overflow-y: auto;
  background: #f8fafc;
  display: flex; flex-direction: column; gap: 2px;
}
.jdocs-nav__item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; text-align: left; background: none; border: none;
  padding: 9px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 500; color: #475569;
  cursor: pointer; transition: 0.15s;
}
.jdocs-nav__item:hover { background: #e2e8f0; color: #1e293b; }
.jdocs-nav__item.active { background: #ede9fe; color: #6366f1; font-weight: 700; }

/* Content */
.jdocs-content {
  flex: 1; overflow-y: auto; padding: 24px 28px;
}
.jdocs-section h2 {
  font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 8px;
  display: flex; align-items: baseline; gap: 10px;
}
.jdocs-section h3 {
  font-size: 14px; font-weight: 700; color: #374151; margin: 20px 0 8px;
}
.jdocs-section p { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px; }
.jdocs-type {
  font-size: 13px; font-weight: 600; color: #6366f1; font-family: monospace;
}

/* Callout */
.jdocs-callout {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 16px; border-radius: 10px; margin-bottom: 20px;
  font-size: 13px; line-height: 1.5;
}
.jdocs-callout--info { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.jdocs-callout--success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

/* Table */
.jdocs-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
.jdocs-table th { background: #f1f5f9; padding: 9px 12px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0; }
.jdocs-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: top; }
.jdocs-table tr:last-child td { border-bottom: none; }
.jdocs-table code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 12px; color: #6366f1; font-family: monospace; }
.jdocs-req { color: #dc2626; font-weight: 700; }

/* Code block */
.jdocs-code {
  background: #1e293b; border-radius: 10px; padding: 16px 20px;
  margin-bottom: 20px; overflow-x: auto;
}
.jdocs-code pre {
  margin: 0; font-size: 12px; line-height: 1.7; color: #94a3b8;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  white-space: pre; overflow-x: auto;
}
.jdocs-code--full { max-height: 500px; overflow-y: auto; }

/* Section grid */
.jdocs-section-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px; margin-bottom: 20px;
}
.jdocs-section-card {
  border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;
  background: #fafafa; transition: 0.2s;
}
.jdocs-section-card:hover { border-color: #a5b4fc; background: #f5f3ff; }
.jdocs-section-card__type code {
  background: #ede9fe; color: #6366f1; padding: 2px 6px;
  border-radius: 4px; font-size: 11px; font-family: monospace;
}
.jdocs-section-card__label {
  font-size: 12px; font-weight: 600; color: #374151; margin-top: 6px;
}
.jdocs-section-card__params {
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;
}
.jdocs-param-tag {
  background: #f1f5f9; color: #64748b; padding: 1px 5px;
  border-radius: 4px; font-size: 10px; font-family: monospace;
}

/* Checklist */
.jdocs-checklist { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 8px; }
.jdocs-checklist li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #374151; }
.jdocs-checklist .check { color: #10b981; font-weight: 700; flex-shrink: 0; }
.jdocs-checklist .warn { color: #f59e0b; font-weight: 700; flex-shrink: 0; }
</style>
