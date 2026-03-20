<template>
  <div class="rf-page">
    <div class="rf-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> {{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
      <div class="rf-header__center">
        <div class="rf-header__icon"><ShieldCheck :size="15" /></div>
        <h3>{{ props.roleId ? t('admin.msg_e9538b18', 'Chỉnh sửa Phân quyền') : t('admin.msg_5e43a894', 'Tạo Phân quyền mới') }}</h3>
      </div>
      <div class="rf-actions">
        <button v-if="props.roleId && !isSuperAdmin" class="btn-delete" @click="deleteRole">
          <Trash2 :size="13" /> Xóa
        </button>
        <button class="btn-save" @click="saveRole" :disabled="saving">
          <Loader2 v-if="saving" :size="13" class="spin" />
          {{ saving ? t('admin.msg_4d30b6f8', 'Đang lưu...') : t('admin.msg_ecf0a713', 'Lưu quyền') }}
        </button>
      </div>
    </div>

    <div class="rf-body">
      <div class="rf-card info-card">
        <h4>{{ t('admin.msg_0464c91b', 'Thông tin chung') }}</h4>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('admin.msg_6cccad8f', 'Tên hiển thị') }} <span class="req">*</span></label>
            <input v-model="editForm.display_name" class="form-input" :placeholder="t('admin.msg_df8eb0', 'VD: Quản lý cửa hàng')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_4bc40106', 'Mã (slug)') }} <span class="req">*</span></label>
            <input v-model="editForm.name" class="form-input" placeholder="VD: store_manager" :disabled="isSuperAdmin" />
          </div>
        </div>
      </div>

      <div class="rf-card matrix-card">
        <h4><CheckSquare :size="14" /> {{ t('admin.msg_06dd9b95', 'Phân quyền chi tiết') }}</h4>
        <p v-if="isSuperAdmin" class="super-note">
          <AlertCircle :size="14" /> Super Admin có toàn quyền - không thể thay đổi chi tiết phân quyền.
        </p>
        <div class="rf-matrix" :class="{ disabled: isSuperAdmin }">
          <div v-for="(group, module) in permissionsByModule" :key="module" class="rf-module">
            <div class="rf-module-header">
              <label class="rf-module-label">
                <input 
                  type="checkbox" 
                  :checked="isModuleFullyChecked(module)" 
                  :indeterminate.prop="isModulePartiallyChecked(module)" 
                  @change="toggleModule(module, $event.target.checked)" 
                  :disabled="isSuperAdmin" 
                />
                <span>{{ moduleLabels[module] || module }}</span>
              </label>
            </div>
            <div class="rf-perms">
              <label v-for="perm in group" :key="perm.id" class="rf-perm-item">
                <input 
                  type="checkbox" 
                  :checked="editForm.permissionIds.includes(perm.id)" 
                  @change="togglePerm(perm.id, $event.target.checked)" 
                  :disabled="isSuperAdmin" 
                />
                <span>{{ perm.display_name }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ShieldCheck, CheckSquare, Save, Trash2, Loader2, AlertCircle } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()

const props = defineProps({
  roleId: { type: Number, default: null },
  allPermissions: { type: Array, default: () => [] },
})
const emit = defineEmits(['back', 'saved'])

const saving = ref(false)
const isSuperAdmin = ref(false)

const editForm = ref({ name: '', display_name: '', permissionIds: [] })

const moduleLabels = {
  products: t('admin.msg_1d1aa192', 'Sản phẩm'), orders: t('admin.msg_adb21d16', 'Đơn hàng'), customers: t('admin.msg_0caa5ce1', 'Khách hàng'),
  cms: 'Trang CMS', banners: 'Banner', promotions: t('admin.msg_c073d6e5', 'Khuyến mãi'),
  settings: t('admin.msg_1a691070', 'Cài đặt'), system: t('admin.msg_09cbc7cd', 'Hệ thống'),
}

const permissionsByModule = computed(() => {
  const map = {}
  for (const p of props.allPermissions) {
    if (!map[p.module]) map[p.module] = []
    map[p.module].push(p)
  }
  return map
})

function isModuleFullyChecked(module) {
  const perms = permissionsByModule.value[module] || []
  return perms.length > 0 && perms.every(p => editForm.value.permissionIds.includes(p.id))
}
function isModulePartiallyChecked(module) {
  const perms = permissionsByModule.value[module] || []
  const checked = perms.filter(p => editForm.value.permissionIds.includes(p.id))
  return checked.length > 0 && checked.length < perms.length
}
function toggleModule(module, checked) {
  const ids = (permissionsByModule.value[module] || []).map(p => p.id)
  if (checked) editForm.value.permissionIds = [...new Set([...editForm.value.permissionIds, ...ids])]
  else editForm.value.permissionIds = editForm.value.permissionIds.filter(id => !ids.includes(id))
}
function togglePerm(id, checked) {
  if (checked) editForm.value.permissionIds.push(id)
  else editForm.value.permissionIds = editForm.value.permissionIds.filter(i => i !== id)
}

onMounted(async () => {
  if (props.roleId) {
    try {
      const res = await apiFetch(`/roles/${props.roleId}`)
      const data = await res.json()
      const detail = data?.data || data
      const perms = detail.permission_list || detail.permissions || []
      isSuperAdmin.value = detail.name === 'super_admin'
      editForm.value = {
        name: detail.name || '',
        display_name: detail.display_name || '',
        permissionIds: perms.map(p => typeof p === 'object' ? p.id : p),
      }
    } catch {
      showToast(t('admin.msg_ed1380', 'Lỗi tải role'), 'error')
      emit('back')
    }
  }
})

async function saveRole() {
  if (!editForm.value.name || !editForm.value.display_name) {
    showToast(t('admin.msg_bd282d', 'Vui lòng nhập đầy đủ tên và mã'), 'warning')
    return
  }
  saving.value = true
  try {
    const payload = { name: editForm.value.name, display_name: editForm.value.display_name, permissions: editForm.value.permissionIds }
    let res;
    if (!props.roleId) {
      res = await apiFetch('/roles', { method: 'POST', body: JSON.stringify(payload) })
    } else {
      res = await apiFetch(`/roles/${props.roleId}`, { method: 'PUT', body: JSON.stringify(payload) })
    }
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = err?.errors ? Object.values(err.errors).flat().join(', ') : (err?.message || t('admin.msg_06286663', 'Không thể lưu role'))
      throw new Error(msg)
    }
    showToast(props.roleId ? t('admin.msg_f4388709', 'Cập nhật role thành công!') : t('admin.msg_e79132f4', 'Tạo role thành công!'), 'success')
    emit('saved')
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

async function deleteRole() {
  if (!confirm(t('admin.msg_13ad8039', 'Xóa role này? Hành động này không thể hoàn tác.'))) return
  try {
    await apiFetch(`/roles/${props.roleId}`, { method: 'DELETE' })
    showToast(t('admin.msg_c5d2b9', 'Đã xóa role'), 'success')
    emit('saved')
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error')
  }
}
</script>

<style scoped>
.rf-page { animation: fadeUp .2s ease; max-width: 900px; margin: 0 auto; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.rf-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
.rf-header__center { display: flex; align-items: center; gap: 8px; }
.rf-header__icon { width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.rf-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-1); }

.btn-back { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-1); font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }

.rf-actions { display: flex; gap: 10px; }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: .6; cursor: not-allowed; }
.btn-delete { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: 1px solid #ef4444; background: #fef2f2; color: #ef4444; font-weight: 600; cursor: pointer; }
.btn-delete:hover { background: #ef4444; color: #fff; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.rf-card { background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.rf-card h4 { font-size: 15px; font-weight: 700; margin: 0 0 16px; display: flex; align-items: center; gap: 6px; color: var(--text-1); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
.req { color: #ef4444; }
.form-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); font-size: 14px; background: var(--bg-1); color: var(--text-1); box-sizing: border-box; }
.form-input:focus { border-color: var(--accent); outline: none; }
.form-input:disabled { background: var(--bg-2); opacity: 0.7; }

.super-note { display: flex; align-items: center; gap: 6px; color: #f59e0b; background: #fffbeb; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
.rf-matrix.disabled { opacity: 0.6; pointer-events: none; }

.rf-module { margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.rf-module-header { background: var(--bg-2); padding: 10px 14px; border-bottom: 1px solid var(--border); }
.rf-module-label { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; cursor: pointer; margin: 0; }
.rf-perms { padding: 14px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.rf-perm-item { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; margin: 0; }
</style>
