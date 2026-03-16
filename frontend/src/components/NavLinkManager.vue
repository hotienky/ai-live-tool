<template>
  <div class="nav-mgr">
    <div class="nm-header">
      <h3><component :is="icons.Menu" :size="16" /> Menu & Liên kết</h3>
      <div class="nm-actions">
        <select v-model="filterGroup" @change="reload" class="nm-filter">
          <option value="">Tất cả</option>
          <option value="menu">Menu chính</option>
          <option value="footer">Footer</option>
        </select>
        <button class="btn-add" @click="openCreate">+ Thêm link</button>
      </div>
    </div>

    <div class="nm-list" v-if="links.length">
      <div v-for="link in links" :key="link.id" class="nm-item">
        <div class="nm-item__main">
          <span v-if="link.icon && icons[link.icon]" class="nm-icon">
            <component :is="icons[link.icon]" :size="16" />
          </span>
          <strong>{{ link.name }}</strong>
          <span class="nm-url">{{ link.url || '#' }}</span>
          <span class="nm-badge nm-badge--group">{{ link.group }}</span>
          <span v-if="link.type === 'collection'" class="nm-badge nm-badge--collection">Dropdown</span>
          <span class="nm-sort">sort: {{ link.sort }}</span>
        </div>
        <div class="nm-item__actions">
          <button class="btn-sm btn-edit" @click="openEdit(link)">Sửa</button>
          <button class="btn-sm btn-del" @click="handleDelete(link)">×</button>
        </div>
        <!-- Children -->
        <div v-if="link.children && link.children.length" class="nm-children">
          <div v-for="child in link.children" :key="child.id" class="nm-item nm-item--child">
            <div class="nm-item__main">
              <span v-if="child.icon && icons[child.icon]" class="nm-icon">
                <component :is="icons[child.icon]" :size="16" />
              </span>
              <strong>{{ child.name }}</strong>
              <span class="nm-url">{{ child.url || '#' }}</span>
            </div>
            <div class="nm-item__actions">
              <button class="btn-sm btn-edit" @click="openEdit(child)">Sửa</button>
              <button class="btn-sm btn-del" @click="handleDelete(child)">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="empty">Chưa có liên kết nào</p>

    <!-- Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ isEditing ? 'Sửa liên kết' : 'Thêm liên kết' }}</h3>
        <div class="form-group"><label>Tên</label><input v-model="form.name" /></div>
        <div class="form-group"><label>URL</label><input v-model="form.url" placeholder="https:// hoặc /page-slug" /></div>
        <div class="form-row">
          <div class="form-group">
            <label>Nhóm</label>
            <select v-model="form.group"><option value="menu">Menu</option><option value="footer">Footer</option></select>
          </div>
          <div class="form-group">
            <label>Kiểu</label>
            <select v-model="form.type"><option value="single">Single</option><option value="collection">Collection (dropdown)</option></select>
          </div>
        </div>
        <div class="form-group" v-if="form.type === 'single'">
          <label>Thuộc dropdown (tùy chọn)</label>
          <select v-model="form.collectionId">
            <option :value="null">— Không —</option>
            <option v-for="cl in collectionLinks" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Target</label>
            <select v-model="form.target"><option value="_self">Cùng tab</option><option value="_blank">Tab mới</option></select>
          </div>
          <div class="form-group form-group--icon">
            <label>Icon</label>
            <div class="icon-picker">
              <button class="icon-picker__trigger" @click="iconDropOpen = !iconDropOpen" type="button">
                <component v-if="form.icon && icons[form.icon]" :is="icons[form.icon]" :size="16" />
                <component v-else :is="icons.CircleDashed" :size="16" class="icon-picker__placeholder" />
                <span>{{ form.icon || 'Chọn icon' }}</span>
                <component :is="icons.ChevronDown" :size="12" />
              </button>
              <div v-if="iconDropOpen" class="icon-picker__dropdown">
                <input v-model="iconSearch" placeholder="Tìm icon..." class="icon-picker__search" />
                <div class="icon-picker__grid">
                  <button
                    v-for="name in filteredIcons" :key="name"
                    class="icon-picker__item"
                    :class="{ active: form.icon === name }"
                    @click="selectIcon(name)"
                    type="button"
                    :title="name"
                  >
                    <component :is="icons[name]" :size="18" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group"><label>Thứ tự</label><input v-model.number="form.sort" type="number" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-save" @click="handleSave">{{ isEditing ? 'Cập nhật' : 'Tạo' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useNavLinks } from '../composables/useNavLinks.js'
import { useToast } from '../composables/useToast.js'
import {
  Menu, Home, ShoppingBag, ShoppingCart, Tag, Star, Phone, Info,
  Search, Heart, User, Settings, Bell, Mail, MapPin, Globe,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp,
  MessageCircle, Send, Share2, ThumbsUp, Eye,
  ChevronDown, CircleDashed, Sparkles, Flame, BadgePercent,
  Store, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, Sun, Moon
} from 'lucide-vue-next'

// Register all icons in a map for dynamic rendering
const icons = {
  Menu, Home, ShoppingBag, ShoppingCart, Tag, Star, Phone, Info,
  Search, Heart, User, Settings, Bell, Mail, MapPin, Globe,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp,
  MessageCircle, Send, Share2, ThumbsUp, Eye,
  ChevronDown, CircleDashed, Sparkles, Flame, BadgePercent,
  Store, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, Sun, Moon
}

// Icon names available for picker (exclude utility icons)
const availableIcons = Object.keys(icons).filter(n => !['ChevronDown', 'CircleDashed', 'Menu'].includes(n))

const { showToast } = useToast()
const { links, loading, fetchLinks, createLink, updateLink, deleteLink } = useNavLinks(apiFetch)

const filterGroup = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref({ name: '', url: '', group: 'menu', type: 'single', collectionId: null, target: '_self', icon: '', sort: 0 })
const iconDropOpen = ref(false)
const iconSearch = ref('')

const collectionLinks = computed(() => links.value.filter(l => l.type === 'collection'))

const filteredIcons = computed(() => {
  const q = iconSearch.value.toLowerCase()
  if (!q) return availableIcons
  return availableIcons.filter(n => n.toLowerCase().includes(q))
})

function selectIcon(name) {
  form.value.icon = name
  iconDropOpen.value = false
  iconSearch.value = ''
}

function reload() { fetchLinks({ ...(filterGroup.value ? { group: filterGroup.value } : {}) }) }
onMounted(reload)

function openCreate() {
  isEditing.value = false; editId.value = null
  form.value = { name: '', url: '', group: 'menu', type: 'single', collectionId: null, target: '_self', icon: '', sort: 0 }
  showModal.value = true
}
function openEdit(l) {
  isEditing.value = true; editId.value = l.id
  form.value = { name: l.name, url: l.url || '', group: l.group, type: l.type, collectionId: l.collectionId, target: l.target, icon: l.icon || '', sort: l.sort }
  showModal.value = true
}
async function handleSave() {
  if (!form.value.name) return showToast('Nhập tên link', 'error')
  try {
    if (isEditing.value) {
      await updateLink(editId.value, form.value)
      showToast(''Đã cập nhật', 'success')
    } else {
      await createLink({ ...form.value })
      showToast(''Đã tạo', 'success')
    }
    showModal.value = false; reload()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function handleDelete(l) {
  if (!confirm(`Xóa link "${l.name}"?`)) return
  await deleteLink(l.id); reload()
  showToast('Đã xóa', 'success')
}
</script>

<style scoped>
.nav-mgr { padding: 0; }
.nm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.nm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.nm-actions { display: flex; gap: .5rem; }
.nm-filter { padding: .3rem .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-1); font-size: .8rem; }
.btn-add { background: var(--accent); color: #fff; border: none; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.nm-list { display: flex; flex-direction: column; gap: .3rem; }
.nm-item { background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; padding: .5rem .7rem; }
.nm-item--child { margin-left: 1.5rem; background: var(--bg-1); border-style: dashed; }
.nm-item__main { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.nm-icon { display: flex; align-items: center; color: var(--accent); }
.nm-url { font-size: .7rem; color: var(--text-3); font-family: monospace; }
.nm-badge { padding: 1px 6px; border-radius: 4px; font-size: .65rem; font-weight: 600; text-transform: uppercase; }
.nm-badge--group { background: rgba(99,102,241,.15); color: #6366f1; }
.nm-badge--collection { background: rgba(245,158,11,.15); color: #f59e0b; }
.nm-sort { font-size: .7rem; color: var(--text-3); margin-left: auto; }
.nm-item__actions { display: flex; gap: .3rem; margin-top: .3rem; }
.nm-children { margin-top: .3rem; display: flex; flex-direction: column; gap: .2rem; }
.btn-sm { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--bg-1); border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin: 0 0 1rem; font-size: 1rem; }
.form-row { display: flex; gap: .5rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: .5rem; }
.form-group label { display: block; font-size: .75rem; color: var(--text-2); margin-bottom: 2px; }
.form-group input, .form-group select { width: 100%; padding: .4rem .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-1); font-size: .85rem; }
.modal-actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }
.btn-cancel { padding: .4rem .8rem; border: 1px solid var(--border); border-radius: 6px; background: transparent; color: var(--text-2); cursor: pointer; }
.btn-save { padding: .4rem .8rem; border: none; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; }

/* Icon Picker */
.form-group--icon { position: relative; }
.icon-picker { position: relative; }
.icon-picker__trigger {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: .4rem .5rem; border: 1px solid var(--border); border-radius: 6px;
  background: var(--bg-2); color: var(--text-1); font-size: .85rem;
  cursor: pointer; text-align: left;
}
.icon-picker__trigger:hover { border-color: var(--accent); }
.icon-picker__trigger span { flex: 1; font-size: .8rem; }
.icon-picker__placeholder { opacity: 0.3; }
.icon-picker__dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  z-index: 200; background: var(--bg-1); border: 1px solid var(--border);
  border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.2);
  padding: 8px; max-height: 280px; overflow: hidden;
  display: flex; flex-direction: column;
}
.icon-picker__search {
  width: 100%; padding: 6px 10px; margin-bottom: 6px;
  border: 1px solid var(--border); border-radius: 6px;
  background: var(--bg-2); color: var(--text-1); font-size: .8rem;
  outline: none;
}
.icon-picker__search:focus { border-color: var(--accent); }
.icon-picker__grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
  overflow-y: auto; max-height: 210px; padding: 2px;
}
.icon-picker__item {
  display: flex; align-items: center; justify-content: center;
  width: 100%; aspect-ratio: 1; border: 1px solid transparent;
  border-radius: 6px; background: none; cursor: pointer;
  color: var(--text-2); transition: all .15s;
}
.icon-picker__item:hover {
  background: var(--accent); color: #fff;
  border-color: var(--accent); transform: scale(1.1);
}
.icon-picker__item.active {
  background: rgba(99,102,241,.15); color: var(--accent);
  border-color: var(--accent);
}
</style>
