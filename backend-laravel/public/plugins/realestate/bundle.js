/**
 * Real Estate Plugin — Full Admin UI
 * Properties, Inquiries, Stats
 */
var Plugin_realestate = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var REStats = { name: 'REStats', setup: function() {
    var stats = e.ref(null); var loading = e.ref(true);
    e.onMounted(async function() { try { var r = await apiFetch('/realestate/stats'); stats.value = (await r.json()).data; } catch(e) {} loading.value = false; });
    return { stats, loading, fmtMoney };
  }, template: '<div class="re-stats"><div v-if="loading" class="re-loading">Đang tải...</div><div v-else-if="stats" class="re-stats-grid">\
    <div class="re-stat-card"><div class="re-stat-num">{{ stats.totalProperties }}</div><div class="re-stat-label">Bất động sản</div></div>\
    <div class="re-stat-card"><div class="re-stat-num">{{ stats.forSale }}</div><div class="re-stat-label">Đang bán</div></div>\
    <div class="re-stat-card"><div class="re-stat-num">{{ stats.forRent }}</div><div class="re-stat-label">Cho thuê</div></div>\
    <div class="re-stat-card"><div class="re-stat-num">{{ stats.totalInquiries }}</div><div class="re-stat-label">Liên hệ</div></div>\
  </div></div>' };

  var REProperties = { name: 'REProperties', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    var filter = e.ref({ type:'', status:'', search:'' });
    e.onMounted(load);
    async function load() { loading.value = true; var p = [];
      if (filter.value.type) p.push('type=' + filter.value.type);
      if (filter.value.status) p.push('status=' + filter.value.status);
      if (filter.value.search) p.push('search=' + filter.value.search);
      try { var r = await apiFetch('/realestate/properties?' + p.join('&')); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { title:'', property_type:'apartment', listing_type:'sale', price:0, area:0, bedrooms:0, bathrooms:0, address:'', city:'', district:'', description:'', features:{}, status:'active', is_featured:false }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/realestate/properties/' + editing.value : '/realestate/properties';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/realestate/properties/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, filter, showModal, form, editing, openCreate, openEdit, save, remove, load, fmtDate, fmtMoney };
  }, template: '\
<div class="re-section"><div class="re-header"><h3>🏠 Bất động sản</h3><button class="re-btn-primary" @click="openCreate">+ Thêm</button></div>\
  <div class="re-filters"><select v-model="filter.type" @change="load" class="re-input"><option value="">Tất cả loại</option><option value="apartment">Căn hộ</option><option value="house">Nhà phố</option><option value="villa">Biệt thự</option><option value="land">Đất nền</option><option value="commercial">Thương mại</option><option value="office">Văn phòng</option></select>\
    <select v-model="filter.status" @change="load" class="re-input"><option value="">Tất cả TT</option><option value="active">Đang đăng</option><option value="sold">Đã bán</option><option value="rented">Đã thuê</option><option value="draft">Nháp</option></select>\
    <input v-model="filter.search" @input="load" class="re-input" placeholder="Tìm..." /></div>\
  <table class="re-table"><thead><tr><th>Tên</th><th>Loại</th><th>Hình thức</th><th>Giá</th><th>DT</th><th>PN</th><th>Khu vực</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="p in items" :key="p.id"><td><strong>{{ p.title }}</strong><span v-if="p.is_featured"> ⭐</span></td>\
    <td>{{ p.property_type }}</td><td>{{ p.listing_type === "sale" ? "Bán" : "Thuê" }}</td>\
    <td>{{ fmtMoney(p.price) }}</td><td>{{ p.area }}m²</td><td>{{ p.bedrooms || "-" }}</td>\
    <td>{{ [p.district, p.city].filter(Boolean).join(", ") || "-" }}</td>\
    <td><span :class="p.status === \'active\' ? \'re-badge-on\' : \'re-badge-off\'">{{ p.status }}</span></td>\
    <td><button @click="openEdit(p)">✏️</button><button class="re-btn-del" @click="remove(p.id)">🗑</button></td></tr></tbody></table>\
  <div v-if="showModal" class="re-modal-overlay" @click.self="showModal=false"><div class="re-modal"><h4>{{ editing ? "Sửa" : "Thêm" }}</h4>\
    <label>Tên <input v-model="form.title" class="re-input" /></label>\
    <div class="re-form-row"><label>Loại BĐS <select v-model="form.property_type" class="re-input"><option value="apartment">Căn hộ</option><option value="house">Nhà phố</option><option value="villa">Biệt thự</option><option value="land">Đất nền</option><option value="commercial">Thương mại</option><option value="office">Văn phòng</option></select></label>\
      <label>Hình thức <select v-model="form.listing_type" class="re-input"><option value="sale">Bán</option><option value="rent">Cho thuê</option></select></label></div>\
    <div class="re-form-row"><label>Giá <input v-model.number="form.price" type="number" class="re-input" /></label>\
      <label>Diện tích (m²) <input v-model.number="form.area" type="number" class="re-input" /></label></div>\
    <div class="re-form-row"><label>Phòng ngủ <input v-model.number="form.bedrooms" type="number" class="re-input" /></label>\
      <label>Phòng tắm <input v-model.number="form.bathrooms" type="number" class="re-input" /></label></div>\
    <label>Địa chỉ <input v-model="form.address" class="re-input" /></label>\
    <div class="re-form-row"><label>Thành phố <input v-model="form.city" class="re-input" /></label>\
      <label>Quận/Huyện <input v-model="form.district" class="re-input" /></label></div>\
    <label>Mô tả <textarea v-model="form.description" class="re-input re-textarea" rows="4"></textarea></label>\
    <div class="re-form-row"><label>Trạng thái <select v-model="form.status" class="re-input"><option value="active">Đang đăng</option><option value="sold">Đã bán</option><option value="rented">Đã thuê</option><option value="draft">Nháp</option></select></label></div>\
    <label class="re-check"><input type="checkbox" v-model="form.is_featured" /> Nổi bật</label>\
    <div class="re-modal-actions"><button class="re-btn-primary" @click="save">💾 Lưu</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var REInquiries = { name: 'REInquiries', setup: function() {
    var items = e.ref([]); var loading = e.ref(true);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/realestate/inquiries'); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    async function updateStatus(id, s) { try { await apiFetch('/realestate/inquiries/' + id, { method:'PUT', body:JSON.stringify({ status:s }) }); load(); } catch(e) {} }
    return { items, loading, updateStatus, fmtDate };
  }, template: '\
<div class="re-section"><h3>📞 Liên hệ tư vấn</h3>\
  <table class="re-table"><thead><tr><th>Khách</th><th>SĐT</th><th>Email</th><th>BĐS</th><th>Tin nhắn</th><th>Ngày</th><th>TT</th></tr></thead>\
  <tbody><tr v-for="i in items" :key="i.id"><td><strong>{{ i.name }}</strong></td><td>{{ i.phone || "-" }}</td><td>{{ i.email || "-" }}</td>\
    <td>{{ i.property ? i.property.title : "-" }}</td><td class="re-msg">{{ i.message || "-" }}</td><td>{{ fmtDate(i.created_at) }}</td>\
    <td><select :value="i.status" @change="updateStatus(i.id, $event.target.value)" class="re-status-sel"><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="closed">Đã xử lý</option></select></td></tr></tbody></table>\
</div>' };

  var REManager = { name: 'REManager',
    components: { REStats:REStats, REProperties:REProperties, REInquiries:REInquiries },
    setup: function() { var tab = e.ref('stats'); return { tab }; },
    template: '<div class="realestate-plugin"><div class="re-tabs">\
      <button :class="{\'re-tab-active\':tab===\'stats\'}" @click="tab=\'stats\'">📊 Tổng quan</button>\
      <button :class="{\'re-tab-active\':tab===\'properties\'}" @click="tab=\'properties\'">🏠 BĐS</button>\
      <button :class="{\'re-tab-active\':tab===\'inquiries\'}" @click="tab=\'inquiries\'">📞 Liên hệ</button></div>\
      <REStats v-if="tab===\'stats\'" /><REProperties v-else-if="tab===\'properties\'" />\
      <REInquiries v-else-if="tab===\'inquiries\'" /></div>' };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) { items.push({key:'realestate/dashboard',label:'Bất động sản',icon:'Building',featureGroup:'store',moduleId:'realestate'}); return items; });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'realestate/dashboard':'realestate'}); return c; });
  }
  var plugin = { id:'realestate', name:'Quản lý Bất động sản', version:'2.0.0',
    components: {'realestate': e.markRaw(REManager) },
    sidebar: {group:'Bất động sản', items:[{key:'realestate-dashboard',label:'BĐS',icon:'Building',route:'realestate/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['realestate'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'realestate', plugin: plugin } }));
  return plugin;
})(Vue);
