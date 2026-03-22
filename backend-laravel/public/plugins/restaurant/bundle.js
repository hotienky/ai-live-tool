/**
 * Restaurant Plugin — Full Admin UI
 * Categories, Menu Items, Reservations, Tables, Hours, Stats
 */
var Plugin_restaurant = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  // ── Stats ──
  var RestStats = {
    name: 'RestStats', setup: function() {
      var stats = e.ref(null); var loading = e.ref(true);
      e.onMounted(async function() {
        try { var r = await apiFetch('/restaurant/stats'); stats.value = (await r.json()).data; } catch(er) {} loading.value = false;
      });
      return { stats, loading, fmtMoney };
    },
    template: '\
<div class="rs-stats"><div v-if="loading" class="rs-loading">Đang tải...</div>\
<div v-else-if="stats" class="rs-stats-grid">\
  <div class="rs-stat-card"><div class="rs-stat-num">{{ stats.totalItems }}</div><div class="rs-stat-label">Món ăn</div></div>\
  <div class="rs-stat-card"><div class="rs-stat-num">{{ stats.categories }}</div><div class="rs-stat-label">Danh mục</div></div>\
  <div class="rs-stat-card"><div class="rs-stat-num">{{ stats.todayReservations }}</div><div class="rs-stat-label">Đặt bàn hôm nay</div></div>\
  <div class="rs-stat-card"><div class="rs-stat-num">{{ stats.tables }}</div><div class="rs-stat-label">Bàn</div></div>\
</div></div>'
  };

  // ── Menu Items ──
  var RestMenu = {
    name: 'RestMenu', setup: function() {
      var items = e.ref([]); var loading = e.ref(true);
      var categories = e.ref([]);
      var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
      e.onMounted(function() { load(); loadCats(); });
      async function loadCats() { try { var r = await apiFetch('/restaurant/categories'); categories.value = (await r.json()).data || []; } catch(e) {} }
      async function load() {
        loading.value = true;
        try { var r = await apiFetch('/restaurant/menu'); var d = await r.json(); items.value = d.data || d; } catch(er) { items.value = []; } loading.value = false;
      }
      function openCreate() { editing.value = null; form.value = { name:'', description:'', price:0, original_price:null, category_id:'', is_available:true, is_popular:false, preparation_time:null, spice_level:'none' }; showModal.value = true; }
      function openEdit(item) { editing.value = item.id; form.value = Object.assign({}, item); showModal.value = true; }
      async function save() {
        try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/restaurant/menu/' + editing.value : '/restaurant/menu';
          await apiFetch(u, { method: m, body: JSON.stringify(form.value) }); showToast('Đã lưu', 'success'); showModal.value = false; load();
        } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
      }
      async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/restaurant/menu/' + id, { method: 'DELETE' }); load(); } catch(e) {} }
      return { items, loading, categories, showModal, form, editing, openCreate, openEdit, save, remove, fmtMoney };
    },
    template: '\
<div class="rs-section"><div class="rs-header"><h3>🍽️ Thực đơn</h3><button class="rs-btn-primary" @click="openCreate">+ Thêm món</button></div>\
  <table class="rs-table"><thead><tr><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Chuẩn bị</th><th>Cay</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="i in items" :key="i.id"><td><strong>{{ i.name }}</strong><span v-if="i.is_popular" class="rs-pop">🔥</span></td>\
    <td>{{ i.category ? i.category.name : "-" }}</td><td>{{ fmtMoney(i.price) }}</td>\
    <td>{{ i.preparation_time ? i.preparation_time + " phút" : "-" }}</td><td>{{ i.spice_level || "-" }}</td>\
    <td><span :class="i.is_available ? \'rs-badge-on\' : \'rs-badge-off\'">{{ i.is_available ? "✅" : "❌" }}</span></td>\
    <td><button @click="openEdit(i)">✏️</button> <button class="rs-btn-del" @click="remove(i.id)">🗑</button></td></tr></tbody></table>\
  <div v-if="showModal" class="rs-modal-overlay" @click.self="showModal=false"><div class="rs-modal"><h4>{{ editing ? "Sửa" : "Thêm" }} món</h4>\
    <label>Tên <input v-model="form.name" class="rs-input" /></label>\
    <label>Danh mục <select v-model="form.category_id" class="rs-input"><option value="">--</option><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option></select></label>\
    <div class="rs-form-row"><label>Giá <input v-model.number="form.price" type="number" class="rs-input" /></label>\
    <label>Giá gốc <input v-model.number="form.original_price" type="number" class="rs-input" /></label></div>\
    <div class="rs-form-row"><label>Chuẩn bị (phút) <input v-model.number="form.preparation_time" type="number" class="rs-input" /></label>\
    <label>Cay <select v-model="form.spice_level" class="rs-input"><option value="none">Không</option><option value="mild">Nhẹ</option><option value="medium">Vừa</option><option value="hot">Cay</option><option value="extra_hot">Rất cay</option></select></label></div>\
    <label class="rs-check"><input type="checkbox" v-model="form.is_available" /> Còn hàng</label>\
    <label class="rs-check"><input type="checkbox" v-model="form.is_popular" /> Phổ biến</label>\
    <div class="rs-modal-actions"><button class="rs-btn-primary" @click="save">💾 Lưu</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>'
  };

  // ── Reservations ──
  var RestReservations = {
    name: 'RestReservations', setup: function() {
      var items = e.ref([]); var loading = e.ref(true);
      var filter = e.ref({ status:'', date:'', search:'' });
      var showModal = e.ref(false); var form = e.ref({});
      e.onMounted(load);
      async function load() {
        loading.value = true; var p = [];
        if (filter.value.status) p.push('status=' + filter.value.status);
        if (filter.value.date) p.push('date=' + filter.value.date);
        if (filter.value.search) p.push('search=' + filter.value.search);
        try { var r = await apiFetch('/restaurant/reservations?' + p.join('&')); items.value = (await r.json()).data || []; } catch(e) { items.value = []; } loading.value = false;
      }
      function openCreate() { form.value = { customer_name:'', customer_phone:'', customer_email:'', date:'', time:'', party_size:2, notes:'' }; showModal.value = true; }
      async function save() {
        try { await apiFetch('/restaurant/reservations', { method: 'POST', body: JSON.stringify(form.value) }); showToast('Đã đặt bàn', 'success'); showModal.value = false; load(); }
        catch(err) { showToast('Lỗi', 'error'); }
      }
      async function updateStatus(id, s) {
        try { await apiFetch('/restaurant/reservations/' + id, { method: 'PUT', body: JSON.stringify({ status: s }) }); load(); } catch(e) {}
      }
      return { items, loading, filter, showModal, form, openCreate, save, updateStatus, load, fmtDate };
    },
    template: '\
<div class="rs-section"><div class="rs-header"><h3>📋 Đặt bàn</h3><button class="rs-btn-primary" @click="openCreate">+ Thêm</button></div>\
  <div class="rs-filters"><select v-model="filter.status" @change="load" class="rs-input"><option value="">Tất cả</option><option value="pending">Chờ</option><option value="confirmed">Xác nhận</option><option value="seated">Đã ngồi</option><option value="completed">Xong</option><option value="cancelled">Huỷ</option></select>\
    <input v-model="filter.date" type="date" @change="load" class="rs-input" /><input v-model="filter.search" @input="load" class="rs-input" placeholder="Tìm..." /></div>\
  <table class="rs-table"><thead><tr><th>Khách</th><th>SĐT</th><th>Ngày</th><th>Giờ</th><th>Số khách</th><th>Mã</th><th>TT</th></tr></thead>\
  <tbody><tr v-for="r in items" :key="r.id"><td>{{ r.customer_name }}</td><td>{{ r.customer_phone }}</td><td>{{ fmtDate(r.date) }}</td><td>{{ r.time }}</td><td>{{ r.party_size }}</td>\
    <td><code>{{ r.confirmation_code || "-" }}</code></td>\
    <td><select :value="r.status" @change="updateStatus(r.id, $event.target.value)" class="rs-status-sel"><option value="pending">Chờ</option><option value="confirmed">Xác nhận</option><option value="seated">Đã ngồi</option><option value="completed">Xong</option><option value="cancelled">Huỷ</option></select></td></tr></tbody></table>\
  <div v-if="showModal" class="rs-modal-overlay" @click.self="showModal=false"><div class="rs-modal"><h4>Đặt bàn</h4>\
    <label>Tên <input v-model="form.customer_name" class="rs-input" /></label>\
    <div class="rs-form-row"><label>SĐT <input v-model="form.customer_phone" class="rs-input" /></label><label>Email <input v-model="form.customer_email" class="rs-input" type="email" /></label></div>\
    <div class="rs-form-row"><label>Ngày <input v-model="form.date" type="date" class="rs-input" /></label><label>Giờ <input v-model="form.time" class="rs-input" placeholder="18:00" /></label></div>\
    <label>Số khách <input v-model.number="form.party_size" type="number" class="rs-input" /></label>\
    <label>Ghi chú <textarea v-model="form.notes" class="rs-input rs-textarea"></textarea></label>\
    <div class="rs-modal-actions"><button class="rs-btn-primary" @click="save">💾 Lưu</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>'
  };

  // ── Tables ──
  var RestTables = {
    name: 'RestTables', setup: function() {
      var items = e.ref([]); var loading = e.ref(true);
      var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
      e.onMounted(load);
      async function load() { loading.value = true; try { var r = await apiFetch('/restaurant/tables'); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
      function openCreate() { editing.value = null; form.value = { table_number:'', capacity:4, location:'', is_active:true }; showModal.value = true; }
      function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
      async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/restaurant/tables/' + editing.value : '/restaurant/tables';
        await apiFetch(u, { method: m, body: JSON.stringify(form.value) }); showToast('Đã lưu', 'success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi', 'error'); } }
      async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/restaurant/tables/' + id, { method: 'DELETE' }); load(); } catch(e) {} }
      return { items, loading, showModal, form, editing, openCreate, openEdit, save, remove };
    },
    template: '\
<div class="rs-section"><div class="rs-header"><h3>🪑 Bàn</h3><button class="rs-btn-primary" @click="openCreate">+ Thêm bàn</button></div>\
  <div class="rs-table-grid"><div v-for="t in items" :key="t.id" class="rs-table-card" :class="{\'rs-table-inactive\':!t.is_active}">\
    <div class="rs-table-num">{{ t.table_number }}</div><div class="rs-table-cap">{{ t.capacity }} chỗ</div>\
    <div class="rs-table-loc">{{ t.location || "-" }}</div>\
    <div class="rs-table-acts"><button @click="openEdit(t)">✏️</button><button @click="remove(t.id)">🗑</button></div></div></div>\
  <div v-if="showModal" class="rs-modal-overlay" @click.self="showModal=false"><div class="rs-modal"><h4>{{ editing ? "Sửa" : "Thêm" }} bàn</h4>\
    <label>Số bàn <input v-model="form.table_number" class="rs-input" /></label>\
    <label>Số chỗ <input v-model.number="form.capacity" type="number" class="rs-input" /></label>\
    <label>Vị trí <input v-model="form.location" class="rs-input" placeholder="Tầng 1, Ngoài trời..." /></label>\
    <label class="rs-check"><input type="checkbox" v-model="form.is_active" /> Hoạt động</label>\
    <div class="rs-modal-actions"><button class="rs-btn-primary" @click="save">💾</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>'
  };

  // ── Main ──
  var RestManager = {
    name: 'RestManager',
    components: { RestStats:RestStats, RestMenu:RestMenu, RestReservations:RestReservations, RestTables:RestTables },
    setup: function() { var tab = e.ref('stats'); return { tab }; },
    template: '\
<div class="restaurant-plugin"><div class="rs-tabs">\
  <button :class="{\'rs-tab-active\':tab===\'stats\'}" @click="tab=\'stats\'">📊 Tổng quan</button>\
  <button :class="{\'rs-tab-active\':tab===\'menu\'}" @click="tab=\'menu\'">🍽️ Thực đơn</button>\
  <button :class="{\'rs-tab-active\':tab===\'reservations\'}" @click="tab=\'reservations\'">📋 Đặt bàn</button>\
  <button :class="{\'rs-tab-active\':tab===\'tables\'}" @click="tab=\'tables\'">🪑 Bàn</button>\
</div>\
  <RestStats v-if="tab===\'stats\'" /><RestMenu v-else-if="tab===\'menu\'" />\
  <RestReservations v-else-if="tab===\'reservations\'" /><RestTables v-else-if="tab===\'tables\'" />\
</div>'
  };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) {
      items.push({key:'restaurant/dashboard',label:'Nhà hàng',icon:'UtensilsCrossed',featureGroup:'store',moduleId:'restaurant'});
      return items;
    });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'restaurant/dashboard':'restaurant'}); return c; });
  }
  var plugin = { id:'restaurant', name:'Quản lý Nhà hàng', version:'2.0.0',
    components: {'restaurant': e.markRaw(RestManager) },
    sidebar: {group:'Nhà hàng', items:[{key:'restaurant-dashboard',label:'Nhà hàng',icon:'UtensilsCrossed',route:'restaurant/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['restaurant'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'restaurant', plugin: plugin } }));
  return plugin;
})(Vue);
