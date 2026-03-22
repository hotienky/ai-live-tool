/**
 * Salon Plugin — Full Admin UI
 * Services, Staff, Appointments, Calendar, Stats
 */
var Plugin_salon = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var SalonStats = { name: 'SalonStats', setup: function() {
    var stats = e.ref(null); var loading = e.ref(true);
    e.onMounted(async function() { try { var r = await apiFetch('/salon/stats'); stats.value = (await r.json()).data; } catch(e) {} loading.value = false; });
    return { stats, loading, fmtMoney };
  }, template: '<div class="sl-stats"><div v-if="loading" class="sl-loading">Đang tải...</div><div v-else-if="stats" class="sl-stats-grid">\
    <div class="sl-stat-card"><div class="sl-stat-num">{{ stats.totalAppointments }}</div><div class="sl-stat-label">Lịch hẹn</div></div>\
    <div class="sl-stat-card"><div class="sl-stat-num">{{ stats.todayAppointments }}</div><div class="sl-stat-label">Hôm nay</div></div>\
    <div class="sl-stat-card"><div class="sl-stat-num">{{ stats.pending }}</div><div class="sl-stat-label">Đang chờ</div></div>\
    <div class="sl-stat-card"><div class="sl-stat-num">{{ fmtMoney(stats.revenue) }}</div><div class="sl-stat-label">Doanh thu</div></div>\
    <div class="sl-stat-card"><div class="sl-stat-num">{{ stats.totalServices }}</div><div class="sl-stat-label">Dịch vụ</div></div>\
    <div class="sl-stat-card"><div class="sl-stat-num">{{ stats.totalStaff }}</div><div class="sl-stat-label">Nhân viên</div></div>\
  </div></div>' };

  var SalonServices = { name: 'SalonServices', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/salon/services'); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { name:'', description:'', duration_minutes:60, price:0, category:'', is_active:true, is_popular:false }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/salon/services/' + editing.value : '/salon/services';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/salon/services/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, showModal, form, editing, openCreate, openEdit, save, remove, fmtMoney };
  }, template: '\
<div class="sl-section"><div class="sl-header"><h3>✂️ Dịch vụ</h3><button class="sl-btn-primary" @click="openCreate">+ Thêm</button></div>\
  <table class="sl-table"><thead><tr><th>Tên</th><th>Thời lượng</th><th>Giá</th><th>Danh mục</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="s in items" :key="s.id"><td><strong>{{ s.name }}</strong><span v-if="s.is_popular"> 🔥</span></td>\
    <td>{{ s.duration_minutes }} phút</td><td>{{ fmtMoney(s.price) }}</td><td>{{ s.category || "-" }}</td>\
    <td><span :class="s.is_active ? \'sl-badge-on\' : \'sl-badge-off\'">{{ s.is_active ? "✅" : "❌" }}</span></td>\
    <td><button @click="openEdit(s)">✏️</button><button class="sl-btn-del" @click="remove(s.id)">🗑</button></td></tr></tbody></table>\
  <div v-if="showModal" class="sl-modal-overlay" @click.self="showModal=false"><div class="sl-modal"><h4>{{ editing ? "Sửa" : "Thêm" }}</h4>\
    <label>Tên <input v-model="form.name" class="sl-input" /></label>\
    <label>Mô tả <textarea v-model="form.description" class="sl-input sl-textarea"></textarea></label>\
    <div class="sl-form-row"><label>Thời lượng (phút) <input v-model.number="form.duration_minutes" type="number" class="sl-input" /></label>\
      <label>Giá <input v-model.number="form.price" type="number" class="sl-input" /></label></div>\
    <label>Danh mục <input v-model="form.category" class="sl-input" /></label>\
    <label class="sl-check"><input type="checkbox" v-model="form.is_active" /> Kích hoạt</label>\
    <label class="sl-check"><input type="checkbox" v-model="form.is_popular" /> Phổ biến</label>\
    <div class="sl-modal-actions"><button class="sl-btn-primary" @click="save">💾</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var SalonStaff = { name: 'SalonStaff', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/salon/staff'); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { name:'', phone:'', email:'', specialties:[], is_active:true }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/salon/staff/' + editing.value : '/salon/staff';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/salon/staff/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, showModal, form, editing, openCreate, openEdit, save, remove };
  }, template: '\
<div class="sl-section"><div class="sl-header"><h3>👤 Nhân viên</h3><button class="sl-btn-primary" @click="openCreate">+ Thêm</button></div>\
  <table class="sl-table"><thead><tr><th>Tên</th><th>SĐT</th><th>Email</th><th>Chuyên môn</th><th>Lịch hẹn</th><th></th></tr></thead>\
  <tbody><tr v-for="s in items" :key="s.id"><td><strong>{{ s.name }}</strong></td><td>{{ s.phone || "-" }}</td><td>{{ s.email || "-" }}</td>\
    <td>{{ s.specialties ? s.specialties.join(", ") : "-" }}</td><td>{{ s.appointments_count || 0 }}</td>\
    <td><button @click="openEdit(s)">✏️</button><button class="sl-btn-del" @click="remove(s.id)">🗑</button></td></tr></tbody></table>\
  <div v-if="showModal" class="sl-modal-overlay" @click.self="showModal=false"><div class="sl-modal"><h4>{{ editing ? "Sửa" : "Thêm" }}</h4>\
    <label>Tên <input v-model="form.name" class="sl-input" /></label>\
    <div class="sl-form-row"><label>SĐT <input v-model="form.phone" class="sl-input" /></label><label>Email <input v-model="form.email" class="sl-input" type="email" /></label></div>\
    <label class="sl-check"><input type="checkbox" v-model="form.is_active" /> Hoạt động</label>\
    <div class="sl-modal-actions"><button class="sl-btn-primary" @click="save">💾</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var SalonAppointments = { name: 'SalonAppointments', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var filter = e.ref({ status:'', date:'', search:'' });
    var services = e.ref([]); var staffList = e.ref([]);
    var showModal = e.ref(false); var form = e.ref({});
    e.onMounted(function() { load(); loadData(); });
    async function loadData() {
      try { var r = await apiFetch('/salon/services'); services.value = (await r.json()).data || []; } catch(e) {}
      try { var r = await apiFetch('/salon/staff'); staffList.value = (await r.json()).data || []; } catch(e) {}
    }
    async function load() { loading.value = true; var p = [];
      if (filter.value.status) p.push('status=' + filter.value.status);
      if (filter.value.date) p.push('date=' + filter.value.date);
      if (filter.value.search) p.push('search=' + filter.value.search);
      try { var r = await apiFetch('/salon/appointments?' + p.join('&')); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { form.value = { service_id:'', staff_id:'', customer_name:'', customer_phone:'', customer_email:'', date:'', time_slot:'', notes:'' }; showModal.value = true; }
    async function save() { try { await apiFetch('/salon/appointments', { method:'POST', body:JSON.stringify(form.value) }); showToast('Đã tạo','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function updateStatus(id, s) { try { await apiFetch('/salon/appointments/' + id, { method:'PUT', body:JSON.stringify({ status:s }) }); load(); } catch(e) {} }
    return { items, loading, filter, services, staffList, showModal, form, openCreate, save, updateStatus, load, fmtDate, fmtMoney };
  }, template: '\
<div class="sl-section"><div class="sl-header"><h3>📅 Lịch hẹn</h3><button class="sl-btn-primary" @click="openCreate">+ Tạo</button></div>\
  <div class="sl-filters"><select v-model="filter.status" @change="load" class="sl-input"><option value="">Tất cả</option><option value="pending">Chờ</option><option value="confirmed">Xác nhận</option><option value="completed">Hoàn thành</option><option value="cancelled">Huỷ</option></select>\
    <input v-model="filter.date" type="date" @change="load" class="sl-input" /><input v-model="filter.search" @input="load" class="sl-input" placeholder="Tìm..." /></div>\
  <table class="sl-table"><thead><tr><th>Khách</th><th>SĐT</th><th>Dịch vụ</th><th>Nhân viên</th><th>Ngày</th><th>Giờ</th><th>Giá</th><th>TT</th></tr></thead>\
  <tbody><tr v-for="a in items" :key="a.id"><td>{{ a.customer_name }}</td><td>{{ a.customer_phone || "-" }}</td>\
    <td>{{ a.service ? a.service.name : "-" }}</td><td>{{ a.staff ? a.staff.name : "-" }}</td>\
    <td>{{ fmtDate(a.date) }}</td><td>{{ a.time_slot }}</td><td>{{ fmtMoney(a.total_price) }}</td>\
    <td><select :value="a.status" @change="updateStatus(a.id, $event.target.value)" class="sl-status-sel"><option value="pending">Chờ</option><option value="confirmed">Xác nhận</option><option value="completed">Xong</option><option value="cancelled">Huỷ</option></select></td></tr></tbody></table>\
  <div v-if="showModal" class="sl-modal-overlay" @click.self="showModal=false"><div class="sl-modal"><h4>Tạo lịch hẹn</h4>\
    <label>Dịch vụ <select v-model="form.service_id" class="sl-input"><option value="">--</option><option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option></select></label>\
    <label>Nhân viên <select v-model="form.staff_id" class="sl-input"><option value="">-- Bất kỳ --</option><option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.name }}</option></select></label>\
    <label>Tên khách <input v-model="form.customer_name" class="sl-input" /></label>\
    <div class="sl-form-row"><label>SĐT <input v-model="form.customer_phone" class="sl-input" /></label><label>Email <input v-model="form.customer_email" class="sl-input" type="email" /></label></div>\
    <div class="sl-form-row"><label>Ngày <input v-model="form.date" type="date" class="sl-input" /></label><label>Giờ <input v-model="form.time_slot" class="sl-input" placeholder="09:00" /></label></div>\
    <label>Ghi chú <textarea v-model="form.notes" class="sl-input sl-textarea"></textarea></label>\
    <div class="sl-modal-actions"><button class="sl-btn-primary" @click="save">💾</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var SalonManager = { name: 'SalonManager',
    components: { SalonStats:SalonStats, SalonServices:SalonServices, SalonStaff:SalonStaff, SalonAppointments:SalonAppointments },
    setup: function() { var tab = e.ref('stats'); return { tab }; },
    template: '<div class="salon-plugin"><div class="sl-tabs">\
      <button :class="{\'sl-tab-active\':tab===\'stats\'}" @click="tab=\'stats\'">📊 Tổng quan</button>\
      <button :class="{\'sl-tab-active\':tab===\'services\'}" @click="tab=\'services\'">✂️ Dịch vụ</button>\
      <button :class="{\'sl-tab-active\':tab===\'staff\'}" @click="tab=\'staff\'">👤 Nhân viên</button>\
      <button :class="{\'sl-tab-active\':tab===\'appointments\'}" @click="tab=\'appointments\'">📅 Lịch hẹn</button></div>\
      <SalonStats v-if="tab===\'stats\'" /><SalonServices v-else-if="tab===\'services\'" />\
      <SalonStaff v-else-if="tab===\'staff\'" /><SalonAppointments v-else-if="tab===\'appointments\'" /></div>' };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) { items.push({key:'salon/dashboard',label:'Salon',icon:'Scissors',featureGroup:'store',moduleId:'salon'}); return items; });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'salon/dashboard':'salon'}); return c; });
  }
  var plugin = { id:'salon', name:'Quản lý Salon', version:'2.0.0',
    components: {'salon': e.markRaw(SalonManager) },
    sidebar: {group:'Salon', items:[{key:'salon-dashboard',label:'Salon',icon:'Scissors',route:'salon/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['salon'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'salon', plugin: plugin } }));
  return plugin;
})(Vue);
