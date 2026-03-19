<template>
  <div class="section-list">
    <div
      v-for="(section, idx) in list"
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
              <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="section.params.autoplay" /><span class="toggle-slider"></span></label>
            </div>
            <div class="param-row" v-if="section.params.autoplay">
              <label>Interval (ms)</label>
              <input type="number" v-model.number="section.params.interval" min="1000" max="10000" step="500" class="param-input" />
            </div>
            <div class="param-row">
              <label>Chiều cao</label>
              <select v-model="section.params.height" class="param-select">
                <option value="sm">Nhỏ</option><option value="md">Vừa</option><option value="lg">Lớn</option>
              </select>
            </div>
          </template>

          <template v-if="section.type === 'categories'">
            <div class="param-row"><label>Số cột</label>
              <input type="range" v-model.number="section.params.columns" min="3" max="8" class="param-range" />
              <span class="param-value">{{ section.params.columns }}</span>
            </div>
            <div class="param-row"><label>Hiện mô tả</label>
              <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="section.params.showDescription" /><span class="toggle-slider"></span></label>
            </div>
            <div class="param-row"><label>Bố cục</label>
              <select v-model="section.params.layoutStyle" class="param-select">
                <option value="grid">Lưới</option><option value="carousel">Carousel</option>
              </select>
            </div>
            <div class="param-row"><label>Hiện số SP</label>
              <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="section.params.showCount" /><span class="toggle-slider"></span></label>
            </div>
            <div class="content-editor" v-if="allCategories.length">
              <label class="content-editor__label">Chọn danh mục hiển thị</label>
              <div v-for="cat in allCategories" :key="cat.id" class="param-row">
                <label style="font-size:12px">{{ cat.name }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" :checked="(section.params.selectedCategoryIds || []).includes(cat.id)" @change="toggleCategoryId(section, cat.id)" /><span class="toggle-slider"></span></label>
              </div>
              <small style="color:#888;font-size:11px">Bỏ chọn tất cả = hiện tất cả</small>
            </div>
          </template>

          <template v-if="section.type === 'flash_sale'">
            <div class="param-row"><label>Hiện đếm ngược</label>
              <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="section.params.showTimer" /><span class="toggle-slider"></span></label>
            </div>
            <div class="param-row"><label>Hiện thanh tiến độ</label>
              <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="section.params.showProgress" /><span class="toggle-slider"></span></label>
            </div>
            <div class="param-row"><label>Số SP</label>
              <input type="range" v-model.number="section.params.count" min="4" max="16" class="param-range" /><span class="param-value">{{ section.params.count || 8 }}</span>
            </div>
            <div class="param-row"><label>Số cột</label>
              <input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" /><span class="param-value">{{ section.params.columns || 4 }}</span>
            </div>
          </template>

          <template v-if="section.type === 'featured_products'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Sản phẩm nổi bật" /></div>
            <div class="param-row"><label>Số lượng</label><input type="range" v-model.number="section.params.count" min="4" max="16" class="param-range" /><span class="param-value">{{ section.params.count }}</span></div>
            <div class="param-row"><label>Số cột</label><input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" /><span class="param-value">{{ section.params.columns }}</span></div>
            <div class="param-row"><label>Lọc danh mục</label>
              <select v-model="section.params.filterCategory" class="param-select">
                <option value="">Tất cả</option><option v-for="c in allCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="param-row"><label>Sắp xếp</label>
              <select v-model="section.params.sortOrder" class="param-select">
                <option value="newest">Mới nhất</option><option value="bestselling">Bán chạy</option>
                <option value="price_asc">Giá tăng</option><option value="price_desc">Giá giảm</option>
              </select>
            </div>
            <div class="param-row" style="margin-top:6px;border-top:1px solid var(--glass-border);padding-top:8px"><label>Slides/hàng</label>
              <select v-model.number="section.params.slidesPerView" class="param-select">
                <option :value="2">2 sản phẩm</option><option :value="3">3 sản phẩm</option>
              </select>
            </div>
            <div class="param-row"><label>Auto-scroll</label><label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="section.params.autoplay" /><span class="toggle-slider"></span></label></div>
            <div class="param-row" v-if="section.params.autoplay !== false"><label>Tốc độ (giây)</label>
              <input type="range" v-model.number="section.params.autoplaySpeed" min="2000" max="8000" step="500" class="param-range" /><span class="param-value">{{ (section.params.autoplaySpeed || 4000) / 1000 }}s</span>
            </div>
          </template>

          <template v-if="section.type === 'new_arrivals'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" placeholder="Hàng mới về" /></div>
            <div class="param-row"><label>Số lượng</label><input type="range" v-model.number="section.params.count" min="4" max="12" class="param-range" /><span class="param-value">{{ section.params.count }}</span></div>
            <div class="param-row"><label>Số cột</label><input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" /><span class="param-value">{{ section.params.columns || 4 }}</span></div>
            <div class="param-row"><label>Sắp xếp</label>
              <select v-model="section.params.sortOrder" class="param-select">
                <option value="newest">Mới nhất</option><option value="bestselling">Bán chạy</option><option value="price_asc">Giá tăng</option><option value="price_desc">Giá giảm</option>
              </select>
            </div>
            <div class="param-row"><label>Slides/hàng</label>
              <select v-model.number="section.params.slidesPerView" class="param-select">
                <option :value="2">2 sản phẩm</option><option :value="3">3 sản phẩm</option>
              </select>
            </div>
            <div class="param-row"><label>Auto-scroll</label><label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="section.params.autoplay" /><span class="toggle-slider"></span></label></div>
          </template>

          <template v-if="section.type === 'cms_pages'">
            <div class="param-row"><label>Bố cục</label>
              <select v-model="section.params.layout" class="param-select"><option value="grid">Lưới</option><option value="list">Danh sách</option></select>
            </div>
            <div class="param-row"><label>Tối đa</label>
              <input type="range" v-model.number="section.params.maxPages" min="3" max="12" class="param-range" /><span class="param-value">{{ section.params.maxPages }}</span>
            </div>
          </template>

          <!-- Library blocks -->
          <template v-if="section.type === 'video_embed'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="content-editor">
              <label class="content-editor__label">Danh sách video</label>
              <div v-for="(item, i) in section.content" :key="i" class="content-item">
                <input type="url" v-model="item.url" class="param-input param-input--wide" placeholder="URL video" />
                <button class="btn-remove-item" @click="removeContentItem(section, i)"><Trash2 :size="12" /></button>
              </div>
              <button class="btn-add-item" @click="addContentItem(section, { url: '', caption: '' })"><Plus :size="12" /> Thêm video</button>
            </div>
          </template>

          <template v-if="section.type === 'testimonials'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="param-row"><label>Số cột</label><input type="range" v-model.number="section.params.columns" min="2" max="4" class="param-range" /><span class="param-value">{{ section.params.columns }}</span></div>
            <div class="content-editor">
              <div v-for="(item, i) in section.content" :key="i" class="content-item" style="flex-direction:column;gap:4px">
                <div style="display:flex;gap:4px">
                  <input type="text" v-model="item.name" class="param-input param-input--wide" placeholder="Tên khách hàng" />
                  <button class="btn-remove-item" @click="removeContentItem(section, i)"><Trash2 :size="12" /></button>
                </div>
                <textarea v-model="item.text" class="param-input param-input--wide content-textarea" rows="2"></textarea>
              </div>
              <button class="btn-add-item" @click="addContentItem(section, { name: '', text: '', rating: 5, avatar: '' })"><Plus :size="12" /> Thêm đánh giá</button>
            </div>
          </template>

          <template v-if="section.type === 'faq'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="content-editor">
              <div v-for="(item, i) in section.content" :key="i" class="content-item" style="flex-direction:column;gap:4px">
                <div style="display:flex;gap:4px">
                  <input type="text" v-model="item.question" class="param-input param-input--wide" placeholder="Câu hỏi" />
                  <button class="btn-remove-item" @click="removeContentItem(section, i)"><Trash2 :size="12" /></button>
                </div>
                <textarea v-model="item.answer" class="param-input param-input--wide content-textarea" rows="2"></textarea>
              </div>
              <button class="btn-add-item" @click="addContentItem(section, { question: '', answer: '' })"><Plus :size="12" /> Thêm câu hỏi</button>
            </div>
          </template>

          <template v-if="section.type === 'image_gallery'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="param-row"><label>Số cột</label><input type="range" v-model.number="section.params.columns" min="2" max="5" class="param-range" /><span class="param-value">{{ section.params.columns }}</span></div>
            <div class="content-editor">
              <div v-for="(item, i) in section.content" :key="i" class="content-item">
                <input type="url" v-model="item.url" class="param-input param-input--wide" placeholder="URL ảnh" />
                <button class="btn-remove-item" @click="removeContentItem(section, i)"><Trash2 :size="12" /></button>
              </div>
              <button class="btn-add-item" @click="addContentItem(section, { url: '', caption: '' })"><Plus :size="12" /> Thêm ảnh</button>
            </div>
          </template>

          <template v-if="section.type === 'text_block'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="content-editor">
              <textarea :value="typeof section.content === 'string' ? section.content : ''" @input="section.content = $event.target.value" class="param-input param-input--wide content-html-editor" rows="6"></textarea>
            </div>
          </template>

          <template v-if="section.type === 'newsletter'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="param-row"><label>Phụ đề</label><input type="text" v-model="section.params.subtitle" class="param-input param-input--wide" /></div>
            <div class="param-row"><label>Nút bấm</label><input type="text" v-model="section.params.buttonText" class="param-input param-input--wide" /></div>
          </template>

          <template v-if="section.type === 'social_feed'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="content-editor">
              <div v-for="(item, i) in section.content" :key="i" class="content-item">
                <select v-model="item.platform" class="param-select"><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option></select>
                <input type="url" v-model="item.url" class="param-input param-input--wide" placeholder="URL" />
                <button class="btn-remove-item" @click="removeContentItem(section, i)"><Trash2 :size="12" /></button>
              </div>
              <button class="btn-add-item" @click="addContentItem(section, { platform: 'facebook', url: '', label: '' })"><Plus :size="12" /> Thêm liên kết</button>
            </div>
          </template>

          <template v-if="section.type === 'brands_slider'">
            <div class="param-row"><label>Tiêu đề</label><input type="text" v-model="section.params.title" class="param-input param-input--wide" /></div>
            <div class="content-editor">
              <div v-for="(item, i) in section.content" :key="i" class="content-item" style="flex-direction:column;gap:4px">
                <div style="display:flex;gap:4px">
                  <input type="text" v-model="item.name" class="param-input param-input--wide" placeholder="Tên hãng" />
                  <button class="btn-remove-item" @click="removeContentItem(section, i)"><Trash2 :size="12" /></button>
                </div>
                <input type="url" v-model="item.logo" class="param-input param-input--wide" placeholder="URL Logo" />
              </div>
              <button class="btn-add-item" @click="addContentItem(section, { name: '', logo: '', url: '' })"><Plus :size="12" /> Thêm hãng</button>
            </div>
          </template>

          <!-- Style Params -->
          <div class="section-style-divider"></div>
          <details class="section-style-details">
            <summary>🎨 Style & Advanced</summary>
            <div class="param-row">
              <label>Nền</label><input type="color" v-model="section.params.sectionBgColor" class="param-color" />
              <button v-if="section.params.sectionBgColor" class="btn-clear-color" @click="section.params.sectionBgColor = ''"><X :size="10" /></button>
            </div>
            <div class="param-row"><label>Padding</label>
              <select v-model="section.params.sectionPadding" class="param-select">
                <option value="">Mặc định</option><option value="sm">Nhỏ</option><option value="md">Vừa</option><option value="lg">Lớn</option><option value="xl">Rất lớn</option>
              </select>
            </div>
            <div class="param-row"><label>Anchor ID</label><input type="text" v-model="section.params.anchorId" class="param-input" /></div>
            <div class="param-row"><label>CSS Class</label><input type="text" v-model="section.params.cssClass" class="param-input" /></div>
          </details>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { GripVertical, Settings2, Trash2, Plus, X } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  sections: { type: Array, required: true },
  sectionMeta: { type: Object, required: true },
  allCategories: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:sections'])

const list = computed({
  get: () => props.sections,
  set: v => emit('update:sections', v),
})

const expandedSection = ref(null)

// Drag Drop Logic
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(e, idx) { dragIndex.value = idx; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)) }
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }
function onDragOver(e) { e.dataTransfer.dropEffect = 'move' }
function onDragEnter(idx) { if (dragIndex.value !== null && dragIndex.value !== idx) dragOverIndex.value = idx }
function onDragLeave(idx) { if (dragOverIndex.value === idx) dragOverIndex.value = null }
function onDrop(targetIdx) {
  const fromIdx = dragIndex.value
  dragOverIndex.value = null
  dragIndex.value = null
  if (fromIdx === null || fromIdx === targetIdx) return
  const currentList = [...list.value]
  const [moved] = currentList.splice(fromIdx, 1)
  currentList.splice(targetIdx, 0, moved)
  currentList.forEach((s, i) => { s.order = i })
  list.value = currentList
}

function toggleExpand(type) {
  expandedSection.value = expandedSection.value === type ? null : type
}

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
</script>
