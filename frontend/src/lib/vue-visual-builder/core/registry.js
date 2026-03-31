import { reactive } from 'vue'

/**
 * Global Registry cho Visual Builder Library
 * Quản lý các schemas (cấu trúc settings, params) và các Vue Component tương ứng.
 */
class BuilderRegistry {
  constructor() {
    this.blocks = reactive({})
    this.categories = reactive([])
    this.events = new EventTarget()
  }

  /**
   * Đăng ký một Block mới vào Builder
   * @param {string} type - Định danh duy nhất (VD: 'hero_banner')
   * @param {Object} spec - Object chứa { component, schema, label, icon, category }
   */
  registerBlock(type, spec) {
    if (!type || !spec) {
      console.warn('[BuilderRegistry] Invalid block registration', type)
      return
    }
    
    // Tự động thêm category nếu chưa có
    const cat = spec.category || 'Basic'
    if (!this.categories.includes(cat)) {
      this.categories.push(cat)
    }

    this.blocks[type] = {
      type,
      label: spec.label || type,
      category: cat,
      icon: spec.icon || null, // Có thể là lucide icon name hoặc SVG string
      component: spec.component || null, // Frontend component cho SSR / Storefront (tuỳ chọn import)
      schema: spec.schema || [], // Definitions các fields (text, color, boolean, list, children, v.v...)
      defaultParams: spec.defaultParams || {},
      hidden: spec.hidden || false // Ẩn khỏi thanh công cụ (Dùng cho system block)
    }

    this.events.dispatchEvent(new CustomEvent('block-registered', { detail: { type } }))
    return this
  }

  /**
   * Đăng ký hàng loạt Block
   */
  registerBlocks(specsMap) {
    for (const [type, spec] of Object.entries(specsMap)) {
      this.registerBlock(type, spec)
    }
    return this
  }

  getBlockSpec(type) {
    return this.blocks[type] || null
  }

  getAllBlocks() {
    return Object.values(this.blocks).filter(b => !b.hidden)
  }

  getGroupedBlocks() {
    const groups = {}
    for (const cat of this.categories) {
      groups[cat] = Object.values(this.blocks).filter(b => b.category === cat && !b.hidden)
    }
    return groups
  }
}

export const registry = new BuilderRegistry()
