<template>
  <div class="layout-builder">
    <div class="layout-builder__header">
      <h3><LayoutDashboard :size="16" /> Bố cục Storefront</h3>
      <div class="layout-builder__header-actions">
        <button v-if="undoStack.length" class="btn-undo" @click="undo" title="Hoàn tác">
          <Undo2 :size="14" />
        </button>
        <button class="btn-preview-toggle" @click="previewMode = previewMode === 'wireframe' ? 'live' : 'wireframe'">
          <Monitor v-if="previewMode === 'wireframe'" :size="14" />
          <Eye v-else :size="14" />
          {{ previewMode === 'wireframe' ? 'Live Preview' : 'Wireframe' }}
        </button>
        <button class="btn-save btn-save--draft" @click="saveDraft" :disabled="saving" title="Lưu nháp">
          <FileEdit :size="14" /> Nháp
        </button>
        <button class="btn-save" @click="saveLayout" :disabled="saving">
          <Save :size="14" /> {{ saving ? 'Đang lưu...' : 'Xuất bản' }}
        </button>
      </div>
    </div>

    <div class="layout-builder__body">
      <!-- Left: Controls -->
      <div class="layout-builder__controls">

        <!-- Templates -->
        <div class="lb-section">
          <h4 class="lb-section__title"><Palette :size="14" /> Mẫu bố cục</h4>
          <div class="template-grid">
            <button
              v-for="tpl in templates"
              :key="tpl.key"
              class="template-card"
              :class="{ active: activeTemplate === tpl.key }"
              @click="applyTemplate(tpl.key)"
            >
              <component :is="tpl.icon" :size="20" />
              <span class="template-card__name">{{ tpl.name }}</span>
              <span class="template-card__desc">{{ tpl.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Sections with Drag & Drop -->
        <div class="lb-section">
          <h4 class="lb-section__title"><Rows3 :size="14" /> Sections trang chủ</h4>
          <div class="section-list">
            <div
              v-for="(section, idx) in sections"
              :key="section.type"
              class="section-item-wrap"
            >
              <div
                class="section-item"
                :class="{
                  disabled: !section.enabled,
                  dragging: dragIndex === idx,
                  'drag-over': dragOverIndex === idx && dragIndex !== idx,
                  expanded: expandedSection === section.type,
                }"
                draggable="true"
                @dragstart="onDragStart($event, idx)"
                @dragend="onDragEnd"
                @dragover.prevent="onDragOver($event, idx)"
                @dragenter.prevent="onDragEnter(idx)"
                @dragleave="onDragLeave(idx)"
                @drop.prevent="onDrop(idx)"
              >
                <div class="section-item__left">
                  <div class="section-item__drag-handle">
                    <GripVertical :size="14" />
                  </div>
                  <component :is="sectionMeta[section.type]?.icon" :size="14" />
                  <span>{{ sectionMeta[section.type]?.label || section.type }}</span>
                </div>
                <div class="section-item__right">
                  <button
                    class="btn-params"
                    @click.stop="toggleExpand(section.type)"
                    title="Tùy chỉnh"
                  ><Settings2 :size="13" /></button>
                  <label class="toggle-switch" @click.stop>
                    <input type="checkbox" v-model="section.enabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Expanded Section Parameters -->
              <transition name="expand">
                <div v-if="expandedSection === section.type" class="section-params">
                  <template v-if="section.type === 'banner'">
                    <div class="param-row">
                      <label>Tự chuyển</label>
                      <label class="toggle-switch toggle-switch--sm" @click.stop>
                        <input type="checkbox" v-model="section.params.autoplay" />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    <div class="param-row" v-if="section.params.autoplay">
                      <label>Interval (ms)</label>
                      <input type="number" v-model.number="section.params.interval" min="1000" max="10000" step="500" class="param-input" />
                    </div>
                    <div class="param-row">
                      <label>Chiều cao</label>
                      <select v-model="section.params.height" class="param-select">
                        <option value="sm">Nhỏ</option>
                        <option value="md">Vừa</option>
                        <option value="lg">Lớn</option>
                      </select>
                    </div>
                  </template>

                  <template v-if="section.type === 'categories'">
                    <div class="param-row">
                      <label>Số cột</label>
                      <input type="range" v-model.number="section.params.columns" min="3" max="8" class="param-range" />
                      <span class="param-value">{{ section.params.columns }}</span>
                    </div>
                    <div class="param-row">
                      <label>Hiện mô tả</label>
                      <label class="toggle-switch toggle-switch--sm" @click.stop>
                        <input type="checkbox" v-model="section.params.showDescription" />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    <div class="param-row">
                      <label>Bố cục</label>
                      <select v-model="section.params.layoutStyle" class="param-select">
                        <option value="grid">Lưới</option>
                        <option value="carousel">Carousel</option>
                      </select>
                    </div>
                    <div class="param-row">
                      <label>Hiện số SP</label>
                      <label class="toggle-switch toggle-switch--sm" @click.stop>
                        <input type="checkbox" v-model="section.params.showCount" />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    <div class="content-editor" v-if="allCategories.length">
                      <label class="content-editor__label">Chọn danh mục hiển thị</label>
                      <div v-for="cat in allCategories" :key="cat.id" class="param-row">
                        <label style="font-size:12px">{{ cat.name }}</label>
                        <label class="toggle-switch toggle-switch--sm" @click.stop>
                          <input type="checkbox" :checked="(section.params.selectedCategoryIds || []).includes(cat.id)" @change="toggleCategoryId(section, cat.id)" />
                          <span class="toggle-slider"></span>
                        </label>
                      </div>
                      <small style="color:#888;font-size:11px">Bỏ chọn tất cả = hiện tất cả</small>
                    </div>
                  </template>

                  <template v-if="section.type === 'flash_sale'">
                    <div class="param-row">
                      <label>Hiện đếm ngược</label>
                      <label class="toggle-switch toggle-switch--sm" @click.stop>
                        <input type="checkbox" v-model="section.params.showTimer" />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    <div class="param-row">
                      <label>Hiện thanh tiến độ</label>
                      <label class="toggle-switch toggle-switch--sm" @click.stop>
                        <input type="checkbox" v-model="section.params.showProgress" />
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    <div class="param-row">
                      <label>Số SP</label>
                      <input type="range" v-model.number="section.params.count" min="4" max="16" class="param-range" />
                      <span class="param-value">{{ section.params.count || 8 }}</span>
                    </div>
                    <div class="param-row">
                      <label>Số cột</label>
                      <input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" />
                      <span class="param-value">{{ section.params.columns || 4 }}</span>
                    </div>
                  </template>

                  <template v-if="section.type === 'featured_products'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Sản phẩm nổi bật" />
                    </div>
                    <div class="param-row">
                      <label>Số lượng</label>
                      <input type="range" v-model.number="section.params.count" min="4" max="16" class="param-range" />
                      <span class="param-value">{{ section.params.count }}</span>
                    </div>
                    <div class="param-row">
                      <label>Số cột</label>
                      <input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" />
                      <span class="param-value">{{ section.params.columns }}</span>
                    </div>
                    <div class="param-row">
                      <label>Lọc danh mục</label>
                      <select v-model="section.params.filterCategory" class="param-select">
                        <option value="">Tất cả</option>
                        <option v-for="c in allCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
                      </select>
                    </div>
                    <div class="param-row">
                      <label>Sắp xếp</label>
                      <select v-model="section.params.sortOrder" class="param-select">
                        <option value="newest">Mới nhất</option>
                        <option value="bestselling">Bán chạy</option>
                        <option value="price_asc">Giá tăng</option>
                        <option value="price_desc">Giá giảm</option>
                      </select>
                    </div>
                  </template>

                  <template v-if="section.type === 'new_arrivals'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Hàng mới về" />
                    </div>
                    <div class="param-row">
                      <label>Số lượng</label>
                      <input type="range" v-model.number="section.params.count" min="4" max="12" class="param-range" />
                      <span class="param-value">{{ section.params.count }}</span>
                    </div>
                    <div class="param-row">
                      <label>Số cột</label>
                      <input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" />
                      <span class="param-value">{{ section.params.columns || 4 }}</span>
                    </div>
                    <div class="param-row">
                      <label>Sắp xếp</label>
                      <select v-model="section.params.sortOrder" class="param-select">
                        <option value="newest">Mới nhất</option>
                        <option value="bestselling">Bán chạy</option>
                        <option value="price_asc">Giá tăng</option>
                        <option value="price_desc">Giá giảm</option>
                      </select>
                    </div>
                  </template>

                  <template v-if="section.type === 'cms_pages'">
                    <div class="param-row">
                      <label>Bố cục</label>
                      <select v-model="section.params.layout" class="param-select">
                        <option value="grid">Lưới</option>
                        <option value="list">Danh sách</option>
                      </select>
                    </div>
                    <div class="param-row">
                      <label>Tối đa</label>
                      <input type="range" v-model.number="section.params.maxPages" min="3" max="12" class="param-range" />
                      <span class="param-value">{{ section.params.maxPages }}</span>
                    </div>
                  </template>

                  <!-- Video Embed -->
                  <template v-if="section.type === 'video_embed'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Video" />
                    </div>
                    <div class="content-editor">
                      <label class="content-editor__label">Danh sách video</label>
                      <div v-for="(item, i) in section.content" :key="i" class="content-item">
                        <div class="content-item__fields">
                          <input type="url" v-model="item.url" class="param-input param-input--wide" placeholder="URL video (YouTube, TikTok...)" />
                          <input type="text" v-model="item.caption" class="param-input param-input--wide" placeholder="Chú thích (tùy chọn)" />
                        </div>
                        <button class="btn-remove-item" @click="removeContentItem(section, i)" title="Xóa"><Trash2 :size="12" /></button>
                      </div>
                      <button class="btn-add-item" @click="addContentItem(section, { url: '', caption: '' })">
                        <Plus :size="12" /> Thêm video
                      </button>
                    </div>
                  </template>

                  <!-- Testimonials -->
                  <template v-if="section.type === 'testimonials'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Khách hàng nói gì" />
                    </div>
                    <div class="param-row">
                      <label>Số cột</label>
                      <input type="range" v-model.number="section.params.columns" min="2" max="4" class="param-range" />
                      <span class="param-value">{{ section.params.columns }}</span>
                    </div>
                    <div class="content-editor">
                      <label class="content-editor__label">Danh sách đánh giá</label>
                      <div v-for="(item, i) in section.content" :key="i" class="content-item">
                        <div class="content-item__fields">
                          <input type="text" v-model="item.name" class="param-input param-input--wide" placeholder="Tên khách hàng" />
                          <textarea v-model="item.text" class="param-input param-input--wide content-textarea" placeholder="Nội dung đánh giá" rows="2"></textarea>
                          <div class="content-item__row">
                            <select v-model.number="item.rating" class="param-select">
                              <option :value="5">5 sao</option>
                              <option :value="4">4 sao</option>
                              <option :value="3">3 sao</option>
                              <option :value="2">2 sao</option>
                              <option :value="1">1 sao</option>
                            </select>
                            <input type="url" v-model="item.avatar" class="param-input param-input--wide" placeholder="URL avatar (tùy chọn)" />
                          </div>
                        </div>
                        <button class="btn-remove-item" @click="removeContentItem(section, i)" title="Xóa"><Trash2 :size="12" /></button>
                      </div>
                      <button class="btn-add-item" @click="addContentItem(section, { name: '', text: '', rating: 5, avatar: '' })">
                        <Plus :size="12" /> Thêm đánh giá
                      </button>
                    </div>
                  </template>

                  <!-- FAQ -->
                  <template v-if="section.type === 'faq'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Câu hỏi thường gặp" />
                    </div>
                    <div class="content-editor">
                      <label class="content-editor__label">Danh sách câu hỏi</label>
                      <div v-for="(item, i) in section.content" :key="i" class="content-item">
                        <div class="content-item__fields">
                          <input type="text" v-model="item.question" class="param-input param-input--wide" placeholder="Câu hỏi" />
                          <textarea v-model="item.answer" class="param-input param-input--wide content-textarea" placeholder="Trả lời" rows="2"></textarea>
                        </div>
                        <button class="btn-remove-item" @click="removeContentItem(section, i)" title="Xóa"><Trash2 :size="12" /></button>
                      </div>
                      <button class="btn-add-item" @click="addContentItem(section, { question: '', answer: '' })">
                        <Plus :size="12" /> Thêm câu hỏi
                      </button>
                    </div>
                  </template>

                  <!-- Image Gallery -->
                  <template v-if="section.type === 'image_gallery'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Thư viện ảnh" />
                    </div>
                    <div class="param-row">
                      <label>Số cột</label>
                      <input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" />
                      <span class="param-value">{{ section.params.columns }}</span>
                    </div>
                    <div class="content-editor">
                      <label class="content-editor__label">Danh sách ảnh</label>
                      <div v-for="(item, i) in section.content" :key="i" class="content-item">
                        <div class="content-item__fields">
                          <input type="url" v-model="item.url" class="param-input param-input--wide" placeholder="URL ảnh" />
                          <input type="text" v-model="item.caption" class="param-input param-input--wide" placeholder="Chú thích (tùy chọn)" />
                        </div>
                        <button class="btn-remove-item" @click="removeContentItem(section, i)" title="Xóa"><Trash2 :size="12" /></button>
                      </div>
                      <button class="btn-add-item" @click="addContentItem(section, { url: '', caption: '' })">
                        <Plus :size="12" /> Thêm ảnh
                      </button>
                    </div>
                  </template>

                  <!-- Text Block -->
                  <template v-if="section.type === 'text_block'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Tiêu đề khối văn bản" />
                    </div>
                    <div class="content-editor">
                      <label class="content-editor__label">Nội dung HTML</label>
                      <textarea
                        :value="typeof section.content === 'string' ? section.content : ''"
                        @input="section.content = $event.target.value"
                        class="param-input param-input--wide content-html-editor"
                        rows="6"
                        placeholder="<h2>Tiêu đề</h2>&#10;<p>Nội dung văn bản...</p>"
                        spellcheck="false"
                      ></textarea>
                    </div>
                  </template>

                  <!-- Newsletter -->
                  <template v-if="section.type === 'newsletter'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Đăng ký nhận tin" />
                    </div>
                    <div class="param-row">
                      <label>Phụ đề</label>
                      <input type="text" v-model="section.params.subtitle" class="param-input param-input--wide" placeholder="Nhận thông tin khuyến mãi..." />
                    </div>
                    <div class="param-row">
                      <label>Nút bấm</label>
                      <input type="text" v-model="section.params.buttonText" class="param-input param-input--wide" placeholder="Đăng ký" />
                    </div>
                  </template>

                  <!-- Social Feed -->
                  <template v-if="section.type === 'social_feed'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Theo dõi chúng tôi" />
                    </div>
                    <div class="content-editor">
                      <label class="content-editor__label">Liên kết mạng xã hội</label>
                      <div v-for="(item, i) in section.content" :key="i" class="content-item">
                        <div class="content-item__fields">
                          <div class="content-item__row">
                            <select v-model="item.platform" class="param-select">
                              <option value="facebook">Facebook</option>
                              <option value="instagram">Instagram</option>
                              <option value="youtube">YouTube</option>
                              <option value="tiktok">TikTok</option>
                              <option value="zalo">Zalo</option>
                              <option value="twitter">Twitter/X</option>
                            </select>
                            <input type="url" v-model="item.url" class="param-input param-input--wide" placeholder="URL trang mạng xã hội" />
                          </div>
                        </div>
                        <button class="btn-remove-item" @click="removeContentItem(section, i)" title="Xóa"><Trash2 :size="12" /></button>
                      </div>
                      <button class="btn-add-item" @click="addContentItem(section, { platform: 'facebook', url: '', label: '' })">
                        <Plus :size="12" /> Thêm liên kết
                      </button>
                    </div>
                  </template>

                  <!-- Brands Slider -->
                  <template v-if="section.type === 'brands_slider'">
                    <div class="param-row">
                      <label>Tiêu đề</label>
                      <input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Thương hiệu" />
                    </div>
                    <div class="content-editor">
                      <label class="content-editor__label">Danh sách thương hiệu</label>
                      <div v-for="(item, i) in section.content" :key="i" class="content-item">
                        <div class="content-item__fields">
                          <input type="text" v-model="item.name" class="param-input param-input--wide" placeholder="Tên thương hiệu" />
                          <div class="content-item__row">
                            <input type="url" v-model="item.logo" class="param-input param-input--wide" placeholder="URL logo" />
                            <input type="url" v-model="item.url" class="param-input param-input--wide" placeholder="URL website (tùy chọn)" />
                          </div>
                        </div>
                        <button class="btn-remove-item" @click="removeContentItem(section, i)" title="Xóa"><Trash2 :size="12" /></button>
                      </div>
                      <button class="btn-add-item" @click="addContentItem(section, { name: '', logo: '', url: '' })">
                        <Plus :size="12" /> Thêm thương hiệu
                      </button>
                    </div>
                  </template>

                  <!-- Section Style Config (all sections) -->
                  <div class="section-style-divider"></div>
                  <details class="section-style-details">
                    <summary>🎨 Style & Advanced</summary>
                    <div class="param-row">
                      <label>Nền</label>
                      <input type="color" v-model="section.params.sectionBgColor" class="param-color" />
                      <button v-if="section.params.sectionBgColor" class="btn-clear-color" @click="section.params.sectionBgColor = ''" title="Xóa"><X :size="10" /></button>
                    </div>
                    <div class="param-row">
                      <label>Padding</label>
                      <select v-model="section.params.sectionPadding" class="param-select">
                        <option value="">Mặc định</option>
                        <option value="sm">Nhỏ (16px)</option>
                        <option value="md">Vừa (32px)</option>
                        <option value="lg">Lớn (48px)</option>
                        <option value="xl">Rất lớn (64px)</option>
                      </select>
                    </div>
                    <div class="param-row">
                      <label>Anchor ID</label>
                      <input type="text" v-model="section.params.anchorId" class="param-input" placeholder="vd: flash-sale" />
                    </div>
                    <div class="param-row">
                      <label>CSS Class</label>
                      <input type="text" v-model="section.params.cssClass" class="param-input" placeholder="custom-class" />
                    </div>
                  </details>
                </div>
              </transition>
            </div>
          </div>

          <!-- Add Section Button (Phase 3 hook) -->
          <button class="btn-add-section" @click="showLibrary = true">
            <Plus :size="14" /> Thêm section
          </button>
        </div>

        <!-- Page Toggles -->
        <div class="lb-section">
          <h4 class="lb-section__title"><FileStack :size="14" /> Trang sẵn có</h4>
          <div class="page-toggle-list">
            <div v-for="pg in pageList" :key="pg.key" class="page-toggle-item">
              <div class="page-toggle-item__info">
                <component :is="pg.icon" :size="14" />
                <span>{{ pg.label }}</span>
                <code class="page-toggle-item__path">{{ pg.path }}</code>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="pages[pg.key]" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Page Configs -->
        <div class="lb-section">
          <h4 class="lb-section__title"><Settings2 :size="14" /> Cấu hình trang</h4>

          <!-- Products Page Config -->
          <div class="page-config" :class="{ expanded: expandedPageConfig === 'products' }">
            <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'products' ? null : 'products'">
              <ShoppingBag :size="14" />
              <span>Trang sản phẩm</span>
              <ChevronDown :size="12" class="page-config__chevron" />
            </div>
            <div v-if="expandedPageConfig === 'products'" class="page-config__body">
              <div class="param-row">
                <label>Sidebar</label>
                <select v-model="pageConfigs.products.sidebarPosition" class="param-select">
                  <option value="left">Bên trái</option>
                  <option value="right">Bên phải</option>
                  <option value="hidden">Ẩn</option>
                </select>
              </div>
              <div class="param-row">
                <label>Cột sản phẩm</label>
                <input type="range" v-model.number="pageConfigs.products.gridColumns" min="2" max="5" class="param-range" />
                <span class="param-value">{{ pageConfigs.products.gridColumns }}</span>
              </div>
              <div class="param-row">
                <label>SP mỗi trang</label>
                <select v-model.number="pageConfigs.products.itemsPerPage" class="param-select">
                  <option :value="8">8</option>
                  <option :value="12">12</option>
                  <option :value="16">16</option>
                  <option :value="24">24</option>
                </select>
              </div>
              <div class="param-row">
                <label>Filter danh mục</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.category" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row">
                <label>Filter thương hiệu</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.brand" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row">
                <label>Filter giá</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.price" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Product Detail Config -->
          <div class="page-config" :class="{ expanded: expandedPageConfig === 'productDetail' }">
            <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'productDetail' ? null : 'productDetail'">
              <Package :size="14" />
              <span>Chi tiết sản phẩm</span>
              <ChevronDown :size="12" class="page-config__chevron" />
            </div>
            <div v-if="expandedPageConfig === 'productDetail'" class="page-config__body">
              <div class="param-row">
                <label>Gallery</label>
                <select v-model="pageConfigs.productDetail.galleryStyle" class="param-select">
                  <option value="thumbnails">Thumbnail</option>
                  <option value="grid">Grid</option>
                </select>
              </div>
              <div class="param-row">
                <label>Tỷ lệ layout</label>
                <select v-model="pageConfigs.productDetail.layoutRatio" class="param-select">
                  <option value="50-50">50 / 50</option>
                  <option value="60-40">60 / 40</option>
                  <option value="40-60">40 / 60</option>
                </select>
              </div>
              <div class="param-row">
                <label>Breadcrumb</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.productDetail.showBreadcrumb" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row">
                <label>SP liên quan</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.productDetail.showRelatedProducts" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row" v-if="pageConfigs.productDetail.showRelatedProducts">
                <label>Số SP liên quan</label>
                <input type="range" v-model.number="pageConfigs.productDetail.relatedCount" min="4" max="8" class="param-range" />
                <span class="param-value">{{ pageConfigs.productDetail.relatedCount }}</span>
              </div>
              <div class="param-row">
                <label>Đánh giá</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.productDetail.showReviews" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Header Config -->
        <div class="lb-section">
          <h4 class="lb-section__title"><LayoutDashboard :size="14" /> Cấu hình Header</h4>
          <div class="param-row">
            <label>Vị trí logo</label>
            <select v-model="headerConfig.logoPosition" class="param-select">
              <option value="left">Trái</option>
              <option value="center">Giữa</option>
            </select>
          </div>
          <div class="param-row">
            <label>Max nav links</label>
            <input type="range" v-model.number="headerConfig.maxNavLinks" min="3" max="10" class="param-range" />
            <span class="param-value">{{ headerConfig.maxNavLinks }}</span>
          </div>
          <div class="param-row">
            <label>Hiện Search</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop>
              <input type="checkbox" v-model="headerConfig.showSearch" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="param-row">
            <label>Sticky</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop>
              <input type="checkbox" v-model="headerConfig.sticky" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="param-row">
            <label>Theme toggle</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop>
              <input type="checkbox" v-model="headerConfig.showThemeToggle" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Footer Config -->
        <div class="lb-section">
          <h4 class="lb-section__title"><LayoutDashboard :size="14" /> Cấu hình Footer</h4>
          <div class="param-row">
            <label>Số cột</label>
            <input type="range" v-model.number="footerConfig.columns" min="2" max="4" class="param-range" />
            <span class="param-value">{{ footerConfig.columns }}</span>
          </div>
          <div class="param-row">
            <label>Hiện liên hệ</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop>
              <input type="checkbox" v-model="footerConfig.showContact" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="param-row">
            <label>Hiện links</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop>
              <input type="checkbox" v-model="footerConfig.showLinks" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="param-row">
            <label>Payment icons</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop>
              <input type="checkbox" v-model="footerConfig.showPaymentIcons" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="param-row">
            <label>Copyright</label>
            <input type="text" v-model="footerConfig.copyrightText" class="param-input param-input--wide" placeholder="© 2026 Shop Name" />
          </div>
        </div>

        <!-- Custom CSS -->
        <div class="lb-section">
          <h4 class="lb-section__title"><Code :size="14" /> CSS tùy chỉnh</h4>
          <textarea
            v-model="customCss"
            class="css-editor"
            rows="6"
            placeholder="/* Custom CSS cho storefront */&#10;.home-page { }&#10;.product-grid { }"
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- Right: Preview -->
      <div class="layout-builder__preview">
        <div class="preview-toolbar">
          <h4 class="lb-section__title"><Eye :size="14" /> Xem trước</h4>
          <div class="preview-responsive" v-if="previewMode === 'live'">
            <button :class="{ active: previewWidth === '100%' }" @click="previewWidth = '100%'" title="Desktop"><Monitor :size="12" /></button>
            <button :class="{ active: previewWidth === '768px' }" @click="previewWidth = '768px'" title="Tablet"><Tablet :size="12" /></button>
            <button :class="{ active: previewWidth === '375px' }" @click="previewWidth = '375px'" title="Mobile"><Smartphone :size="12" /></button>
          </div>
        </div>

        <!-- Wireframe Preview -->
        <div v-if="previewMode === 'wireframe'" class="preview-frame">
          <div class="pv-header">
            <div class="pv-logo"></div>
            <div class="pv-nav">
              <span v-if="pages.products" class="pv-nav-item"></span>
              <span v-if="pages.cart" class="pv-nav-item pv-nav-item--sm"></span>
              <span v-if="pages.account" class="pv-nav-item pv-nav-item--sm"></span>
            </div>
          </div>
          <div class="pv-body">
            <template v-for="section in activeSections" :key="section.type">
              <div class="pv-section" :class="'pv-section--' + section.type">
                <div class="pv-section__label">{{ sectionMeta[section.type]?.label || section.type }}</div>
                <div class="pv-section__visual" :style="{ height: sectionMeta[section.type]?.pvHeight || '30px' }"></div>
              </div>
            </template>
          </div>
          <div class="pv-footer"></div>
        </div>

        <!-- Live Preview (iframe) -->
        <div v-else class="preview-live" :style="{ maxWidth: previewWidth }">
          <iframe
            v-if="storefrontUrl"
            :src="livePreviewUrl"
            class="preview-iframe"
            :key="previewKey"
          ></iframe>
          <div v-else class="preview-no-url">
            <AlertCircle :size="24" />
            <p>Nhập URL storefront để sử dụng Live Preview</p>
            <div class="preview-url-input">
              <input
                v-model="storefrontUrl"
                type="url"
                placeholder="https://store.fashionvn.com"
                @keyup.enter="previewKey++"
              />
              <button class="btn-sm" @click="previewKey++" :disabled="!storefrontUrl">Xem</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Library Modal (Phase 3) -->
    <div class="modal-overlay" v-if="showLibrary" @click.self="showLibrary = false">
      <div class="modal modal--library">
        <div class="modal__header">
          <h3><Layers :size="16" /> Thư viện Section</h3>
          <button class="btn-close" @click="showLibrary = false"><X :size="18" /></button>
        </div>
        <div class="library-grid">
          <button
            v-for="lib in libraryItems"
            :key="lib.type"
            class="library-card"
            :class="{ added: sections.some(s => s.type === lib.type) }"
            @click="addLibrarySection(lib)"
          >
            <component :is="lib.icon" :size="24" />
            <strong>{{ lib.label }}</strong>
            <span>{{ lib.desc }}</span>
            <span v-if="sections.some(s => s.type === lib.type)" class="library-card__badge">Đã thêm</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import {
  LayoutDashboard, Save, Palette, Rows3, GripVertical, Settings2, ChevronUp, ChevronDown,
  Eye, ShoppingBag, ShoppingCart, User, Truck, FileStack, Plus, X, Code,
  Image, Grid3x3, Zap, Sparkles, Clock, BookOpen, Store, Target, Package,
  Monitor, Tablet, Smartphone, AlertCircle, Layers,
  MessageSquareQuote, HelpCircle, Images, Video, Type, Mail, Share2, Award,
  Trash2, Undo2, FileEdit
} from 'lucide-vue-next'

const { showToast } = useToast()

const sections = ref([])
const pages = ref({})
const customCss = ref('')
const activeTemplate = ref('full_store')
const saving = ref(false)
const expandedSection = ref(null)
const showLibrary = ref(false)
const previewMode = ref('wireframe')
const previewWidth = ref('100%')
const previewKey = ref(0)
const storefrontUrl = ref('')
const expandedPageConfig = ref(null)
const allCategories = ref([])

// Undo stack
const undoStack = ref([])
const MAX_UNDO = 20
function pushUndo() {
  const snap = JSON.stringify({ sections: sections.value, pageConfigs: pageConfigs.value, headerConfig: headerConfig.value, footerConfig: footerConfig.value })
  undoStack.value.push(snap)
  if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
}
function undo() {
  if (!undoStack.value.length) return
  const snap = JSON.parse(undoStack.value.pop())
  sections.value = ensureParams(snap.sections || [])
  if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
  if (snap.headerConfig) headerConfig.value = snap.headerConfig
  if (snap.footerConfig) footerConfig.value = snap.footerConfig
}

// Header / Footer config
const defaultHeaderConfig = { logoPosition: 'left', maxNavLinks: 5, showSearch: true, sticky: true, showThemeToggle: true }
const defaultFooterConfig = { columns: 3, showContact: true, showLinks: true, showPaymentIcons: false, copyrightText: '' }
const headerConfig = ref({ ...defaultHeaderConfig })
const footerConfig = ref({ ...defaultFooterConfig })

const defaultPageConfigs = {
  products: {
    sidebarPosition: 'left',
    gridColumns: 4,
    itemsPerPage: 12,
    showFilters: { category: true, brand: true, price: true },
  },
  productDetail: {
    galleryStyle: 'thumbnails',
    layoutRatio: '50-50',
    showBreadcrumb: true,
    showRelatedProducts: true,
    relatedCount: 6,
    showReviews: true,
  },
}
const pageConfigs = ref(JSON.parse(JSON.stringify(defaultPageConfigs)))

// ─── Drag & Drop ───
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(e, idx) {
  dragIndex.value = idx
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
}
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }
function onDragOver(e) { e.dataTransfer.dropEffect = 'move' }
function onDragEnter(idx) {
  if (dragIndex.value !== null && dragIndex.value !== idx) dragOverIndex.value = idx
}
function onDragLeave(idx) {
  if (dragOverIndex.value === idx) dragOverIndex.value = null
}
function onDrop(targetIdx) {
  const fromIdx = dragIndex.value
  dragOverIndex.value = null
  dragIndex.value = null
  if (fromIdx === null || fromIdx === targetIdx) return
  const list = [...sections.value]
  const [moved] = list.splice(fromIdx, 1)
  list.splice(targetIdx, 0, moved)
  list.forEach((s, i) => { s.order = i })
  sections.value = list
}

// ─── Section expand ───
function toggleExpand(type) {
  expandedSection.value = expandedSection.value === type ? null : type
}

// ─── Content item helpers ───
function addContentItem(section, defaultItem) {
  if (!section.content) section.content = []
  section.content.push({ ...defaultItem })
}
function removeContentItem(section, index) {
  section.content.splice(index, 1)
}

function toggleCategoryId(section, catId) {
  if (!section.params.selectedCategoryIds) section.params.selectedCategoryIds = []
  const idx = section.params.selectedCategoryIds.indexOf(catId)
  if (idx >= 0) section.params.selectedCategoryIds.splice(idx, 1)
  else section.params.selectedCategoryIds.push(catId)
}

async function loadCategories() {
  try {
    const res = await apiFetch('/categories')
    const data = await res.json()
    allCategories.value = Array.isArray(data) ? data : (data.data || [])
  } catch { allCategories.value = [] }
}

// ─── Section Meta ───
const sectionMeta = {
  banner: { label: 'Banner', icon: Image, pvHeight: '50px' },
  categories: { label: 'Danh mục', icon: Grid3x3, pvHeight: '25px' },
  flash_sale: { label: 'Flash Sale', icon: Zap, pvHeight: '35px' },
  featured_products: { label: 'Sản phẩm nổi bật', icon: Sparkles, pvHeight: '60px' },
  new_arrivals: { label: 'Hàng mới về', icon: Clock, pvHeight: '60px' },
  cms_pages: { label: 'Trang CMS', icon: BookOpen, pvHeight: '30px' },
  // Library sections (Phase 3)
  testimonials: { label: 'Đánh giá KH', icon: MessageSquareQuote, pvHeight: '45px' },
  faq: { label: 'FAQ', icon: HelpCircle, pvHeight: '40px' },
  image_gallery: { label: 'Thư viện ảnh', icon: Images, pvHeight: '50px' },
  video_embed: { label: 'Video', icon: Video, pvHeight: '55px' },
  text_block: { label: 'Khối văn bản', icon: Type, pvHeight: '35px' },
  newsletter: { label: 'Đăng ký email', icon: Mail, pvHeight: '30px' },
  social_feed: { label: 'Mạng xã hội', icon: Share2, pvHeight: '25px' },
  brands_slider: { label: 'Thương hiệu', icon: Award, pvHeight: '30px' },
}

const defaultParams = {
  banner: { autoplay: true, interval: 4000, height: 'md' },
  categories: { columns: 6, showDescription: false, layoutStyle: 'grid', showCount: false, selectedCategoryIds: [] },
  flash_sale: { showTimer: true, showProgress: true, count: 8, columns: 4 },
  featured_products: { title: 'Sản phẩm nổi bật', count: 8, columns: 4, filterCategory: '', sortOrder: 'newest' },
  new_arrivals: { title: 'Hàng mới về', count: 4, columns: 4, sortOrder: 'newest' },
  cms_pages: { layout: 'grid', maxPages: 6 },
  testimonials: { title: 'Khách hàng nói gì', columns: 3 },
  faq: { title: 'Câu hỏi thường gặp' },
  image_gallery: { title: 'Thư viện ảnh', columns: 3 },
  video_embed: { title: 'Video' },
  text_block: { title: '' },
  newsletter: { title: 'Đăng ký nhận tin', subtitle: 'Nhận thông tin khuyến mãi và sản phẩm mới nhất', buttonText: 'Đăng ký' },
  social_feed: { title: 'Theo dõi chúng tôi' },
  brands_slider: { title: 'Thương hiệu', animationSpeed: 20 },
}

// ─── Library ───
const libraryItems = [
  { type: 'testimonials', label: 'Đánh giá KH', desc: 'Hiện testimonials khách hàng', icon: MessageSquareQuote },
  { type: 'faq', label: 'FAQ', desc: 'Câu hỏi thường gặp', icon: HelpCircle },
  { type: 'image_gallery', label: 'Thư viện ảnh', desc: 'Gallery ảnh sản phẩm', icon: Images },
  { type: 'video_embed', label: 'Video', desc: 'Embed YouTube/TikTok', icon: Video },
  { type: 'text_block', label: 'Khối văn bản', desc: 'Nội dung HTML tùy ý', icon: Type },
  { type: 'newsletter', label: 'Đăng ký email', desc: 'Form đăng ký nhận tin', icon: Mail },
  { type: 'social_feed', label: 'Mạng xã hội', desc: 'Links social media', icon: Share2 },
  { type: 'brands_slider', label: 'Thương hiệu', desc: 'Logo thương hiệu', icon: Award },
]

function addLibrarySection(lib) {
  if (sections.value.some(s => s.type === lib.type)) {
    showToast('Section đã tồn tại', 'error')
    return
  }
  sections.value.push({
    type: lib.type,
    enabled: true,
    order: sections.value.length,
    params: { ...defaultParams[lib.type] },
    content: [],
  })
  showLibrary.value = false
  expandedSection.value = lib.type
}

// ─── Page List ───
const pageList = [
  { key: 'products', label: 'Sản phẩm', icon: ShoppingBag, path: '/products' },
  { key: 'cart', label: 'Giỏ hàng', icon: ShoppingCart, path: '/cart' },
  { key: 'account', label: 'Tài khoản', icon: User, path: '/account' },
  { key: 'auth', label: 'Đăng nhập', icon: User, path: '/auth' },
  { key: 'order_tracking', label: 'Tra cứu đơn', icon: Truck, path: '/order-tracking' },
]

// ─── Templates ───
const templates = [
  { key: 'full_store', name: 'Full Store', desc: 'Tất cả sections', icon: Store },
  { key: 'catalog', name: 'Catalog', desc: 'Danh mục + SP', icon: Package },
  { key: 'minimal', name: 'Minimal', desc: 'Banner + SP nổi bật', icon: Target },
  { key: 'landing', name: 'Landing Page', desc: 'Banner + CMS', icon: BookOpen },
]
const templatePresets = {
  full_store: { sections: ['banner', 'categories', 'flash_sale', 'featured_products', 'new_arrivals', 'cms_pages'] },
  catalog: { sections: ['banner', 'categories', 'featured_products', 'new_arrivals'] },
  minimal: { sections: ['banner', 'featured_products'] },
  landing: { sections: ['banner', 'cms_pages'] },
}

const activeSections = computed(() =>
  sections.value.filter(s => s.enabled).sort((a, b) => a.order - b.order)
)

function applyTemplate(key) {
  activeTemplate.value = key
  const preset = templatePresets[key]
  if (!preset) return
  // Keep only built-in sections for template, preserve custom sections
  const builtIn = ['banner', 'categories', 'flash_sale', 'featured_products', 'new_arrivals', 'cms_pages']
  sections.value.forEach(s => {
    if (builtIn.includes(s.type)) {
      s.enabled = preset.sections.includes(s.type)
    }
  })
  const order = preset.sections
  sections.value.sort((a, b) => {
    const aIdx = order.indexOf(a.type)
    const bIdx = order.indexOf(b.type)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })
  sections.value.forEach((s, i) => { s.order = i })
}

// ─── Live Preview ───
const livePreviewUrl = computed(() => {
  if (!storefrontUrl.value) return ''
  const config = {
    sections: sections.value,
    pages: pages.value,
    customCss: customCss.value,
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))))
  return `${storefrontUrl.value}?preview_layout=${encoded}`
})

// Debounced preview refresh
let previewTimer
let undoTimer
watch([sections, pages, customCss, headerConfig, footerConfig, pageConfigs], () => {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => { previewKey.value++ }, 800)
  // Push undo snapshot on changes (debounced)
  clearTimeout(undoTimer)
  undoTimer = setTimeout(() => pushUndo(), 1500)
}, { deep: true })

// ─── Load / Save ───
function ensureParams(sections) {
  return sections.map(s => ({
    ...s,
    params: { ...(defaultParams[s.type] || {}), ...(s.params || {}) },
    content: s.content || [],
  }))
}

async function loadLayout() {
  try {
    const res = await apiFetch('/system-config/group/storefront_layout')
    const data = await res.json()
    const items = Array.isArray(data) ? data : (data.data || [])
    const map = {}
    items.forEach(i => { map[i.key] = i.value })

    const defaultSections = [
      { type: 'banner', enabled: true, order: 0 },
      { type: 'categories', enabled: true, order: 1 },
      { type: 'flash_sale', enabled: true, order: 2 },
      { type: 'featured_products', enabled: true, order: 3 },
      { type: 'new_arrivals', enabled: true, order: 4 },
      { type: 'cms_pages', enabled: true, order: 5 },
    ]
    const defaultPages = { cart: true, account: true, auth: true, order_tracking: true, products: true }

    const parsed = map.layout_sections ? JSON.parse(map.layout_sections) : null
    sections.value = ensureParams(parsed || defaultSections)
    pages.value = map.layout_pages ? JSON.parse(map.layout_pages) : defaultPages
    activeTemplate.value = map.layout_template || 'full_store'
    customCss.value = map.layout_custom_css || ''
    storefrontUrl.value = map.storefront_url || ''
    const parsedPC = map.layout_page_configs ? JSON.parse(map.layout_page_configs) : null
    if (parsedPC) {
      pageConfigs.value = {
        products: { ...defaultPageConfigs.products, ...parsedPC.products, showFilters: { ...defaultPageConfigs.products.showFilters, ...(parsedPC.products?.showFilters || {}) } },
        productDetail: { ...defaultPageConfigs.productDetail, ...parsedPC.productDetail },
      }
    }
    const parsedHC = map.layout_header_config ? JSON.parse(map.layout_header_config) : null
    if (parsedHC) headerConfig.value = { ...defaultHeaderConfig, ...parsedHC }
    const parsedFC = map.layout_footer_config ? JSON.parse(map.layout_footer_config) : null
    if (parsedFC) footerConfig.value = { ...defaultFooterConfig, ...parsedFC }
  } catch {
    sections.value = ensureParams([
      { type: 'banner', enabled: true, order: 0 },
      { type: 'categories', enabled: true, order: 1 },
      { type: 'flash_sale', enabled: true, order: 2 },
      { type: 'featured_products', enabled: true, order: 3 },
      { type: 'new_arrivals', enabled: true, order: 4 },
      { type: 'cms_pages', enabled: true, order: 5 },
    ])
    pages.value = { cart: true, account: true, auth: true, order_tracking: true, products: true }
  }
}

async function saveLayout() {
  saving.value = true
  try {
    await apiFetch('/system-config/group/storefront_layout', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { key: 'layout_sections', value: JSON.stringify(sections.value) },
          { key: 'layout_pages', value: JSON.stringify(pages.value) },
          { key: 'layout_template', value: activeTemplate.value },
          { key: 'layout_custom_css', value: customCss.value },
          { key: 'layout_page_configs', value: JSON.stringify(pageConfigs.value) },
          { key: 'layout_header_config', value: JSON.stringify(headerConfig.value) },
          { key: 'layout_footer_config', value: JSON.stringify(footerConfig.value) },
          { key: 'storefront_url', value: storefrontUrl.value },
        ],
      }),
    })
    showToast('Đã xuất bản bố cục storefront', 'success')
  } catch (e) {
    showToast('Lỗi lưu: ' + e.message, 'error')
  }
  saving.value = false
}

async function saveDraft() {
  saving.value = true
  try {
    await apiFetch('/system-config/group/storefront_layout', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { key: 'layout_draft_sections', value: JSON.stringify(sections.value) },
          { key: 'layout_draft_page_configs', value: JSON.stringify(pageConfigs.value) },
          { key: 'layout_draft_header_config', value: JSON.stringify(headerConfig.value) },
          { key: 'layout_draft_footer_config', value: JSON.stringify(footerConfig.value) },
        ],
      }),
    })
    showToast('Đã lưu nháp', 'success')
  } catch (e) {
    showToast('Lỗi lưu nháp: ' + e.message, 'error')
  }
  saving.value = false
}

onMounted(() => { loadLayout(); loadCategories() })
</script>

<style scoped>
.layout-builder__header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.layout-builder__header h3 {
  margin: 0; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px;
}
.layout-builder__header-actions { display: flex; gap: 8px; align-items: center; }

.btn-preview-toggle {
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 5px; transition: all 0.2s;
}
.btn-preview-toggle:hover { border-color: #7c3aed; color: #a78bfa; }

.btn-save {
  padding: 8px 18px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff;
  font-weight: 700; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
}
.btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.layout-builder__body { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }

.lb-section { margin-bottom: 24px; }
.lb-section__title {
  font-size: 13px; font-weight: 700; color: var(--color-text-secondary);
  margin: 0 0 12px; display: flex; align-items: center; gap: 6px;
}

/* Templates */
.template-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.template-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 10px; border-radius: 12px;
  border: 2px solid var(--glass-border); background: var(--glass-bg);
  cursor: pointer; transition: all 0.2s; color: var(--color-text-secondary);
}
.template-card:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.template-card.active { border-color: #7c3aed; background: rgba(124, 58, 237, 0.06); color: #a78bfa; }
.template-card__name { font-size: 12px; font-weight: 700; }
.template-card__desc { font-size: 10px; color: var(--color-text-muted); text-align: center; }

/* Section list with drag-and-drop */
.section-list { display: flex; flex-direction: column; gap: 4px; }
.section-item-wrap { display: flex; flex-direction: column; }
.section-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  transition: all 0.25s cubic-bezier(.4, 0, .2, 1);
  cursor: grab;
}
.section-item:active { cursor: grabbing; }
.section-item.disabled { opacity: 0.4; }
.section-item.dragging {
  opacity: 0.3; transform: scale(0.96); border-color: #7c3aed;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.section-item.drag-over {
  border: 2px dashed #7c3aed; transform: scale(1.02);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
  background: rgba(124, 58, 237, 0.03);
}
.section-item.expanded { border-color: #7c3aed; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.section-item__left {
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
}
.section-item__drag-handle {
  color: var(--color-text-muted); opacity: 0.4; transition: opacity 0.2s; cursor: grab;
}
.section-item:hover .section-item__drag-handle { opacity: 1; }
.section-item__right { display: flex; align-items: center; gap: 6px; }
.btn-params {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid var(--glass-border); background: transparent;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.btn-params:hover { border-color: #7c3aed; color: #a78bfa; }

/* Section params panel */
.section-params {
  padding: 12px 16px; border: 1px solid #7c3aed; border-top: none;
  border-radius: 0 0 10px 10px;
  background: rgba(124, 58, 237, 0.03);
}
.param-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 6px 0; font-size: 12px; color: var(--color-text-secondary);
}
.param-row label:first-child { font-weight: 600; white-space: nowrap; min-width: 80px; }
.param-input {
  padding: 4px 8px; border: 1px solid var(--glass-border); border-radius: 6px;
  background: var(--glass-bg); color: var(--color-text-primary);
  font-size: 12px; width: 80px;
}
.param-input--wide { width: 100%; flex: 1; }
.param-select {
  padding: 4px 8px; border: 1px solid var(--glass-border); border-radius: 6px;
  background: var(--glass-bg); color: var(--color-text-primary); font-size: 12px;
}
.param-range { flex: 1; accent-color: #7c3aed; }
.param-value {
  font-weight: 700; color: #a78bfa; min-width: 20px; text-align: center;
}

/* Expand animation */
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 1200px; }

/* Content editor */
.content-editor { margin-top: 6px; }
.content-editor__label {
  display: block; font-size: 11px; font-weight: 700; color: var(--color-text-muted);
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
}
.content-item {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 10px; margin-bottom: 6px; border-radius: 8px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
}
.content-item__fields { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.content-item__row { display: flex; gap: 6px; }
.content-item__row .param-select { min-width: 110px; }
.content-textarea {
  resize: vertical; min-height: 40px; line-height: 1.4;
  font-family: inherit;
}
.content-html-editor {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px; line-height: 1.5; resize: vertical; min-height: 100px;
}
.btn-add-item {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  width: 100%; padding: 7px; margin-top: 4px;
  border: 1px dashed var(--glass-border); border-radius: 6px;
  background: transparent; color: var(--color-text-muted);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-add-item:hover { border-color: #7c3aed; color: #a78bfa; background: rgba(124, 58, 237, 0.03); }
.btn-remove-item {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; min-width: 24px; margin-top: 4px;
  border-radius: 6px; border: 1px solid transparent;
  background: transparent; color: var(--color-text-muted);
  cursor: pointer; transition: all 0.15s;
}
.btn-remove-item:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.06); }

/* Page config */
.page-config { margin-bottom: 6px; border-radius: 10px; border: 1px solid var(--glass-border); overflow: hidden; }
.page-config.expanded { border-color: #7c3aed; }
.page-config__header {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: var(--glass-bg); cursor: pointer; font-size: 13px; font-weight: 600;
  transition: all 0.15s;
}
.page-config__header:hover { background: rgba(124, 58, 237, 0.03); }
.page-config__header span { flex: 1; }
.page-config__chevron { transition: transform 0.2s; color: var(--color-text-muted); }
.page-config.expanded .page-config__chevron { transform: rotate(180deg); color: #a78bfa; }
.page-config__body { padding: 10px 14px; background: rgba(124, 58, 237, 0.03); border-top: 1px solid var(--glass-border); }

/* Section style */
.section-style-divider { height: 1px; background: var(--glass-border); margin: 10px 0; }
.section-style-details { font-size: 12px; }
.section-style-details summary {
  cursor: pointer; font-weight: 600; color: var(--color-text-muted);
  padding: 6px 0; user-select: none; font-size: 11px;
}
.section-style-details summary:hover { color: #a78bfa; }
.section-style-details[open] summary { color: #7c3aed; }
.param-color {
  width: 32px; height: 24px; border: 1px solid var(--glass-border);
  border-radius: 6px; cursor: pointer; padding: 0;
}
.btn-clear-color {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px;
  border: none; background: rgba(239,68,68,0.1); color: #ef4444;
  cursor: pointer; font-size: 10px;
}

/* Undo & Draft */
.btn-undo {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.btn-undo:hover { border-color: #7c3aed; color: #a78bfa; }
.btn-save--draft {
  background: var(--glass-bg) !important;
  border: 1px solid var(--glass-border) !important;
  color: var(--color-text-muted) !important;
}
.btn-save--draft:hover { border-color: #7c3aed !important; color: #a78bfa !important; }

/* Add section */
.btn-add-section {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px; margin-top: 8px;
  border: 2px dashed var(--glass-border); border-radius: 10px;
  background: transparent; color: var(--color-text-muted);
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-add-section:hover { border-color: #7c3aed; color: #a78bfa; background: rgba(124, 58, 237, 0.03); }

/* Toggle switch */
.toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0; }
.toggle-switch--sm { width: 32px; height: 18px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; inset: 0; background: var(--glass-border); border-radius: 20px; transition: all 0.2s;
}
.toggle-slider::before {
  content: ''; position: absolute; width: 16px; height: 16px;
  left: 2px; bottom: 2px; background: #fff; border-radius: 50%; transition: all 0.2s;
}
.toggle-switch--sm .toggle-slider::before { width: 14px; height: 14px; }
.toggle-switch input:checked + .toggle-slider { background: #7c3aed; }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(16px); }
.toggle-switch--sm input:checked + .toggle-slider::before { transform: translateX(14px); }

/* Page toggles */
.page-toggle-list { display: flex; flex-direction: column; gap: 6px; }
.page-toggle-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
}
.page-toggle-item__info { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.page-toggle-item__path {
  font-size: 11px; color: var(--color-text-muted);
  background: rgba(124, 58, 237, 0.06); padding: 1px 6px; border-radius: 4px;
}

/* CSS Editor */
.css-editor {
  width: 100%; padding: 12px; border: 1px solid var(--glass-border); border-radius: 10px;
  background: var(--glass-bg); color: var(--color-text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12px;
  resize: vertical; min-height: 80px; line-height: 1.5;
}
.css-editor:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }

/* Preview */
.layout-builder__preview { position: sticky; top: 10px; align-self: flex-start; }
.preview-toolbar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.preview-toolbar .lb-section__title { margin: 0; }
.preview-responsive { display: flex; gap: 2px; }
.preview-responsive button {
  padding: 4px 8px; border: 1px solid var(--glass-border); border-radius: 4px;
  background: transparent; color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.preview-responsive button.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }

.preview-frame {
  border: 1px solid var(--glass-border); border-radius: 12px;
  overflow: hidden; background: var(--color-bg-primary);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.pv-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-bottom: 1px solid var(--glass-border); background: var(--glass-bg);
}
.pv-logo { width: 50px; height: 10px; border-radius: 4px; background: var(--color-text-muted); opacity: 0.3; }
.pv-nav { display: flex; gap: 6px; }
.pv-nav-item { width: 30px; height: 8px; border-radius: 3px; background: var(--color-text-muted); opacity: 0.2; }
.pv-nav-item--sm { width: 16px; }
.pv-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.pv-section { border-radius: 6px; padding: 6px 8px; border: 1px dashed var(--glass-border); background: var(--glass-bg); }
.pv-section__label { font-size: 9px; color: var(--color-text-muted); font-weight: 700; margin-bottom: 4px; }
.pv-section__visual { border-radius: 4px; background: var(--color-border); opacity: 0.3; }
.pv-section--banner .pv-section__visual { background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(236, 72, 153, 0.2)); opacity: 0.6; }
.pv-section--flash_sale .pv-section__visual { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2)); opacity: 0.6; }
.pv-section--featured_products .pv-section__visual { background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.15)); opacity: 0.6; }
.pv-section--testimonials .pv-section__visual { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15)); opacity: 0.6; }
.pv-section--faq .pv-section__visual { background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.15)); opacity: 0.6; }
.pv-footer { padding: 6px; border-top: 1px solid var(--glass-border); background: var(--glass-bg); height: 16px; }

/* Live preview */
.preview-live {
  border: 1px solid var(--glass-border); border-radius: 12px; overflow: hidden;
  transition: max-width 0.3s ease; margin: 0 auto;
}
.preview-iframe { width: 100%; height: 600px; border: none; background: #fff; }
.preview-no-url {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px 20px; color: var(--color-text-muted); text-align: center;
}
.preview-no-url p { font-size: 12px; }
.preview-url-input { display: flex; gap: 6px; width: 100%; max-width: 320px; margin-top: 4px; }
.preview-url-input input { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1); font-size: 12px; }
.preview-url-input input:focus { outline: none; border-color: var(--accent); }
.preview-url-input .btn-sm { padding: 6px 14px; border-radius: 6px; border: none; background: var(--accent); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
.preview-url-input .btn-sm:disabled { opacity: .4; cursor: not-allowed; }

/* Library Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal--library { background: var(--bg-1, #1a1a2e); border-radius: 16px; padding: 24px; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; }
.modal__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal__header h3 { margin: 0; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.btn-close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; }

.library-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.library-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px 14px; border-radius: 12px;
  border: 2px solid var(--glass-border); background: var(--glass-bg);
  cursor: pointer; transition: all 0.2s; color: var(--color-text-secondary);
  text-align: center; position: relative;
}
.library-card:hover { border-color: #7c3aed; color: var(--color-text-primary); transform: translateY(-2px); }
.library-card.added { opacity: 0.5; cursor: default; }
.library-card strong { font-size: 13px; }
.library-card span { font-size: 11px; color: var(--color-text-muted); }
.library-card__badge {
  position: absolute; top: 8px; right: 8px;
  background: rgba(34, 197, 94, 0.15); color: #22c55e;
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
}

@media (max-width: 768px) {
  .layout-builder__body { grid-template-columns: 1fr; }
  .template-grid { grid-template-columns: repeat(2, 1fr); }
  .library-grid { grid-template-columns: 1fr; }
}
</style>
