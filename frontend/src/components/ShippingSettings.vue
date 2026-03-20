<template>
  <div class="shipping-cfg">
    <h3 class="shipping-cfg__title"><Truck :size="16" /> {{ t('admin.msg_76b97ece', 'Cấu hình vận chuyển') }}</h3>
    <p class="shipping-cfg__desc">Cấu hình API key cho các đơn vị vận chuyển. Bật đơn vị nào thì khách hàng sẽ thấy tùy chọn đó khi checkout.</p>

    <!-- GHN -->
    <div class="provider-card" :class="{ active: form.shipping_ghn_enabled === '1' }">
      <div class="provider-card__header">
        <div class="provider-card__info">
          <strong>{{ t('admin.msg_1335ac29', 'Giao Hàng Nhanh (GHN)') }}</strong>
          <span class="provider-card__badge" :class="form.shipping_ghn_enabled === '1' ? 'badge--green' : 'badge--gray'">
            {{ form.shipping_ghn_enabled === '1' ? t('admin.msg_cc7df86c', '✓ Đang bật') : t('admin.msg_6b9b46ed', '○ Tắt') }}
          </span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" :checked="form.shipping_ghn_enabled === '1'" @change="form.shipping_ghn_enabled = $event.target.checked ? '1' : '0'" />
          <span class="toggle-switch__slider"></span>
        </label>
      </div>
      <div v-if="form.shipping_ghn_enabled === '1'" class="provider-card__body">
        <div class="form-group">
          <label>API Token</label>
          <input v-model="form.shipping_ghn_token" type="password" :placeholder="t('admin.msg_52a78c', 'Token từ GHN')" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Shop ID</label>
            <input v-model="form.shipping_ghn_shop_id" placeholder="VD: 12345" />
          </div>
          <div class="form-group">
            <label>Sandbox</label>
            <label class="checkbox-label">
              <input type="checkbox" :checked="form.shipping_ghn_sandbox === '1'" @change="form.shipping_ghn_sandbox = $event.target.checked ? '1' : '0'" />
              Dùng môi trường test
            </label>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('admin.msg_ad0e1310', 'District ID kho hàng') }}</label>
            <input v-model="form.shipping_ghn_from_district" placeholder="VD: 1454" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_2bcbc477', 'Ward Code kho hàng') }}</label>
            <input v-model="form.shipping_ghn_from_ward" placeholder="VD: 21211" />
          </div>
        </div>
        <p class="provider-card__hint">{{ t('admin.msg_0c03933b', 'Lấy Token + Shop ID tại:') }} <a href="https://dev.ghn.vn" target="_blank">dev.ghn.vn</a></p>
      </div>
    </div>

    <!-- GHTK -->
    <div class="provider-card" :class="{ active: form.shipping_ghtk_enabled === '1' }">
      <div class="provider-card__header">
        <div class="provider-card__info">
          <strong>{{ t('admin.msg_92428506', 'Giao Hàng Tiết Kiệm (GHTK)') }}</strong>
          <span class="provider-card__badge" :class="form.shipping_ghtk_enabled === '1' ? 'badge--green' : 'badge--gray'">
            {{ form.shipping_ghtk_enabled === '1' ? t('admin.msg_cc7df86c', '✓ Đang bật') : t('admin.msg_6b9b46ed', '○ Tắt') }}
          </span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" :checked="form.shipping_ghtk_enabled === '1'" @change="form.shipping_ghtk_enabled = $event.target.checked ? '1' : '0'" />
          <span class="toggle-switch__slider"></span>
        </label>
      </div>
      <div v-if="form.shipping_ghtk_enabled === '1'" class="provider-card__body">
        <div class="form-group">
          <label>API Token</label>
          <input v-model="form.shipping_ghtk_token" type="password" :placeholder="t('admin.msg_8dea92', 'Token từ GHTK')" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('admin.msg_bde87a4d', 'Tỉnh/Thành kho hàng') }}</label>
            <input v-model="form.shipping_ghtk_pick_province" :placeholder="t('admin.msg_dde842', 'VD: TP. Hồ Chí Minh')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_500fcfd9', 'Quận/Huyện kho hàng') }}</label>
            <input v-model="form.shipping_ghtk_pick_district" :placeholder="t('admin.msg_1bcd02', 'VD: Quận 1')" />
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" :checked="form.shipping_ghtk_sandbox === '1'" @change="form.shipping_ghtk_sandbox = $event.target.checked ? '1' : '0'" />
            Dùng môi trường test (sandbox)
          </label>
        </div>
        <p class="provider-card__hint">{{ t('admin.msg_96e78221', 'Lấy Token tại:') }} <a href="https://khachhang.giaohangtietkiem.vn" target="_blank">khachhang.giaohangtietkiem.vn</a> {{ t('admin.msg_ff324d52', '→ Thông tin shop → API Token') }}</p>
      </div>
    </div>

    <!-- Viettel Post -->
    <div class="provider-card" :class="{ active: form.shipping_vtp_enabled === '1' }">
      <div class="provider-card__header">
        <div class="provider-card__info">
          <strong>Viettel Post</strong>
          <span class="provider-card__badge" :class="form.shipping_vtp_enabled === '1' ? 'badge--green' : 'badge--gray'">
            {{ form.shipping_vtp_enabled === '1' ? t('admin.msg_cc7df86c', '✓ Đang bật') : t('admin.msg_6b9b46ed', '○ Tắt') }}
          </span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" :checked="form.shipping_vtp_enabled === '1'" @change="form.shipping_vtp_enabled = $event.target.checked ? '1' : '0'" />
          <span class="toggle-switch__slider"></span>
        </label>
      </div>
      <div v-if="form.shipping_vtp_enabled === '1'" class="provider-card__body">
        <div class="form-group">
          <label>API Token</label>
          <input v-model="form.shipping_vtp_token" type="password" :placeholder="t('admin.msg_91bef7', 'Token từ Viettel Post')" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('admin.msg_9dda1e90', 'Province ID kho hàng') }}</label>
            <input v-model="form.shipping_vtp_sender_province" placeholder="VD: 2" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_ad0e1310', 'District ID kho hàng') }}</label>
            <input v-model="form.shipping_vtp_sender_district" placeholder="VD: 35" />
          </div>
        </div>
        <p class="provider-card__hint">{{ t('admin.msg_96e78221', 'Lấy Token tại:') }} <a href="https://partner.viettelpost.vn" target="_blank">partner.viettelpost.vn</a></p>
      </div>
    </div>

    <!-- VietMap API -->
    <div class="provider-card active">
      <div class="provider-card__header">
        <div class="provider-card__info">
          <strong><Map :size="14" /> {{ t('admin.msg_9301edd2', 'VietMap (Địa chỉ autocomplete)') }}</strong>
          <span class="provider-card__badge" :class="form.shipping_vietmap_api_key ? 'badge--green' : 'badge--gray'">
            {{ form.shipping_vietmap_api_key ? t('admin.msg_d97ea39a', '✓ Đã cấu hình') : t('admin.msg_2a34202c', '○ Chưa có key') }}
          </span>
        </div>
      </div>
      <div class="provider-card__body">
        <div class="form-group">
          <label>VietMap API Key</label>
          <input v-model="form.shipping_vietmap_api_key" type="password" :placeholder="t('admin.msg_42ed56', 'API Key từ VietMap')" />
        </div>
        <p class="provider-card__hint">{{ t('admin.msg_0212fe75', 'Dùng cho tính năng autocomplete địa chỉ trên storefront. Đăng ký tại:') }} <a href="https://maps.vietmap.vn" target="_blank">maps.vietmap.vn</a></p>
      </div>
    </div>

    <button class="btn-primary" @click="save" :disabled="saving" style="margin-top:8px">
      <Save :size="14" />
      {{ saving ? t('admin.saving', 'Đang lưu...') : 'Lưu cấu hình vận chuyển' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Truck, Save } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const { showToast } = useToast()
const saving = ref(false)

const KEYS = [
  'shipping_ghn_enabled', 'shipping_ghn_token', 'shipping_ghn_shop_id',
  'shipping_ghn_from_district', 'shipping_ghn_from_ward', 'shipping_ghn_sandbox',
  'shipping_ghtk_enabled', 'shipping_ghtk_token',
  'shipping_ghtk_pick_province', 'shipping_ghtk_pick_district', 'shipping_ghtk_sandbox',
  'shipping_vtp_enabled', 'shipping_vtp_token',
  'shipping_vtp_sender_province', 'shipping_vtp_sender_district',
  'shipping_vietmap_api_key',
]

const form = ref(Object.fromEntries(KEYS.map(k => [k, ''])))

onMounted(async () => {
  try {
    const res = await apiFetch('/system-config')
    const json = await res.json()
    const list = Array.isArray(json) ? json : (json.data || [])
    for (const item of list) {
      const k = item.key || item.config_key
      if (k && KEYS.includes(k)) {
        form.value[k] = item.value || item.config_value || ''
      }
    }
  } catch (e) { console.warn('Failed to load shipping config', e) }
})

async function save() {
  saving.value = true
  try {
    const items = KEYS.map(key => ({
      key,
      value: form.value[key] || '',
      type: 'string',
      group_name: 'shipping',
    }))
    await apiFetch('/system-config', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
    showToast(t('admin.msg_b3e281', 'Đã lưu cấu hình vận chuyển'), 'success')
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu: ' + (e.message || 'Unknown'), 'error')
  }
  saving.value = false
}
</script>

<style scoped>
/* Title */
.shipping-cfg__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 17px; font-weight: 800; margin: 0 0 6px;
  color: var(--text-1);
}
.shipping-cfg__title svg { color: var(--accent); }
.shipping-cfg__desc {
  font-size: 13px; color: var(--text-3);
  margin: 0 0 24px; line-height: 1.5;
}

/* Provider Card */
.provider-card {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: 10px; margin-bottom: 16px; overflow: hidden;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.provider-card:hover { border-color: var(--color-border-hover); }
.provider-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 4px 12px rgba(124,58,237,0.08);
}
.provider-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
}
.provider-card__info { display: flex; flex-direction: column; gap: 6px; }
.provider-card__info strong { font-size: 14px; color: var(--text-1); }

.provider-card__badge {
  font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 12px;
  display: inline-block; width: fit-content;
}

.provider-card__body {
  padding: 16px 20px; border-top: 1px solid var(--border);
}
.provider-card__hint {
  font-size: 12px; color: var(--text-3); margin-top: 4px; line-height: 1.5;
}
.provider-card__hint a { color: var(--accent); text-decoration: none; font-weight: 500; }
.provider-card__hint a:hover { text-decoration: underline; }

/* Checkbox */
.checkbox-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; cursor: pointer; color: var(--text-1);
  margin-top: 6px;
}
.checkbox-label input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer;
}

/* Toggle Switch */
.toggle-switch {
  position: relative; display: inline-block;
  width: 44px; height: 24px; cursor: pointer; flex-shrink: 0;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-switch__slider {
  position: absolute; inset: 0;
  background: var(--bg-3, #ccc); border-radius: 24px; transition: 0.3s; cursor: pointer;
}
.toggle-switch__slider::before {
  content: ''; position: absolute; left: 3px; top: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: white; transition: 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.toggle-switch input:checked + .toggle-switch__slider {
  background: var(--accent);
}
.toggle-switch input:checked + .toggle-switch__slider::before {
  transform: translateX(20px);
}
</style>
