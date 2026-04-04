<template>
  <div class="nav-builder">
    <div class="nav-header">
      <h2><Link class="icon" :size="20"/> Trình tạo Menu Điều hướng (JSON)</h2>
      <button class="cpb-btn-save" @click="saveMenu" :disabled="saving">
        <Save class="icon" :size="16" /> {{ saving ? 'Đang lưu...' : 'Lưu lại' }}
      </button>
    </div>

    <div class="nav-content">
      <div class="nav-list-wrapper">
        <div class="menu-selector">
          <label>Chọn Menu:</label>
          <select v-model="selectedMenuLocation" class="param-input" @change="loadMenu">
            <option value="header">Header Menu</option>
            <option value="footer">Footer Menu</option>
            <option value="sidebar">Sidebar Menu</option>
          </select>
        </div>

        <div class="tree-container">
          <draggable class="drag-area" tag="ul" :list="menuItems" :group="{ name: 'g1' }" item-key="id">
            <template #item="{ element, index }">
              <li class="menu-node">
                <div class="node-content">
                  <GripVertical class="handle" :size="16" />
                  <input v-model="element.name" class="param-input menu-input" placeholder="Tên hiển thị" />
                  <input v-model="element.url" class="param-input menu-input" placeholder="Đường dẫn (URL)" />
                  <button class="node-btn node-btn--add" @click="addChild(element)" title="Thêm sub-menu"><Plus :size="14"/></button>
                  <button class="node-btn node-btn--del" @click="removeChild(menuItems, index)" title="Xoá"><Trash2 :size="14"/></button>
                </div>
                <!-- Vuedraggable nested -->
                <draggable v-if="element.children" class="drag-area sub-menu" tag="ul" :list="element.children" :group="{ name: 'g1' }" item-key="id">
                  <template #item="{ element: subElement, index: subIndex }">
                    <li class="menu-node">
                      <div class="node-content">
                        <GripVertical class="handle" :size="16" />
                        <input v-model="subElement.name" class="param-input menu-input" placeholder="Tên hiển thị" />
                        <input v-model="subElement.url" class="param-input menu-input" placeholder="Đường dẫn (URL)" />
                        <button class="node-btn node-btn--del" @click="removeChild(element.children, subIndex)" title="Xoá"><Trash2 :size="14"/></button>
                      </div>
                    </li>
                  </template>
                </draggable>
              </li>
            </template>
          </draggable>

          <button class="btn-add-root" @click="addRootItem"><Plus :size="16" /> Thêm Menu Mới</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Link, Save, GripVertical, Plus, Trash2 } from 'lucide-vue-next'

const { showToast } = useToast()

const saving = ref(false)
const selectedMenuLocation = ref('header')
const menuId = ref(null)

const menuItems = ref([])

function addRootItem() {
  menuItems.value.push({ id: Date.now().toString(), name: 'Menu mới', url: '', children: [] })
}

function addChild(parent) {
  if (!parent.children) parent.children = []
  parent.children.push({ id: Date.now().toString(), name: 'Sub-menu', url: '' })
}

function removeChild(list, index) {
  if (confirm('Xoá menu này?')) list.splice(index, 1)
}

async function loadMenu() {
  try {
    const res = await apiFetch(`/navigation-menus/location/${selectedMenuLocation.value}`)
    if (res && res.data) {
      menuId.value = res.data.id
      menuItems.value = res.data.json_data || []
    } else {
      menuId.value = null
      menuItems.value = []
    }
  } catch (e) {
    if (e.status === 404) {
      menuId.value = null
      menuItems.value = []
    } else {
      showToast('Lỗi khi tải menu', 'error')
    }
  }
}

async function saveMenu() {
  saving.value = true
  try {
    if (menuId.value) {
      await apiFetch(`/navigation-menus/${menuId.value}`, {
        method: 'PUT',
        body: JSON.stringify({ name: selectedMenuLocation.value + ' Menu', json_data: menuItems.value })
      })
    } else {
      const res = await apiFetch('/navigation-menus', {
        method: 'POST',
        body: JSON.stringify({ name: selectedMenuLocation.value + ' Menu', location: selectedMenuLocation.value, json_data: menuItems.value })
      })
      if (res.data) menuId.value = res.data.id
    }
    showToast('Đã lưu cấu trúc menu!', 'success')
  } catch (e) {
    showToast('Lỗi khi lưu menu', 'error')
  }
  saving.value = false
}

onMounted(() => {
  loadMenu()
})
</script>

<style scoped>
.nav-builder { display: flex; flex-direction: column; height: 100%; background: var(--bg-0); }
.nav-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fff; }
.nav-header h2 { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
.nav-content { padding: 24px; overflow-y: auto; flex: 1; }
.menu-selector { margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.menu-selector label { font-weight: 600; }
.menu-selector select { max-width: 250px; }

.tree-container { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.drag-area { list-style: none; padding: 0; margin: 0; min-height: 20px; }
.sub-menu { padding-left: 32px; border-left: 2px dashed var(--border); margin-left: 14px; margin-top: 8px; }

.menu-node { margin-bottom: 8px; }
.node-content { display: flex; align-items: center; gap: 8px; background: var(--bg-1); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); }
.handle { cursor: grab; color: var(--text-3); }
.handle:active { cursor: grabbing; }
.menu-input { flex: 1; min-width: 150px; }

.node-btn { width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: 0.2s; }
.node-btn--add { background: var(--accent-light); color: var(--accent); }
.node-btn--add:hover { background: var(--accent); color: #fff; }
.node-btn--del { background: #fee2e2; color: #ef4444; }
.node-btn--del:hover { background: #ef4444; color: #fff; }

.btn-add-root { display: flex; align-items: center; gap: 6px; background: transparent; border: 1px dashed var(--border); width: 100%; padding: 12px; justify-content: center; border-radius: 6px; color: var(--accent); font-weight: 600; cursor: pointer; margin-top: 16px; transition: 0.2s; }
.btn-add-root:hover { background: var(--accent-light); border-color: var(--accent); }

.cpb-btn-save { display: flex; align-items: center; gap: 6px; background: var(--accent); color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.cpb-btn-save:hover { background: var(--accent-hover); }
</style>
