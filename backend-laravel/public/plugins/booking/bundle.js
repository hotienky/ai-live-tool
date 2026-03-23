/**
 * Booking Plugin — Full Admin UI
 * Services CRUD, Appointments management, Calendar, Stats Dashboard
 */
var Plugin_booking = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  var t = (bridge && bridge.t) || function(k, d) { return d; };

  // ── Helpers ──
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }
  var STATUS_MAP = { pending: 'Chờ xử lý', confirmed: 'Xác nhận', completed: 'Hoàn thành', cancelled: 'Đã huỷ', no_show: 'Vắng mặt' };

  // ══════════════════════════════════════
  // Stats Dashboard
  // ══════════════════════════════════════
  var BookingStats = {
    name: 'BookingStats',
    setup: function() {
      var stats = e.ref(null);
      var loading = e.ref(true);
      e.onMounted(async function() {
        try { var r = await apiFetch('/booking/stats'); stats.value = (await r.json()).data || await r.json(); }
        catch(err) { showToast('Lỗi tải stats', 'error'); }
        loading.value = false;
      });
      return { stats, loading, fmtMoney };
    },
    template: '\
<div class="bk-stats">\
  <div v-if="loading" class="bk-loading">Đang tải thống kê...</div>\
  <div v-else-if="stats" class="bk-stats-grid">\
    <div class="bk-stat-card"><div class="bk-stat-num">{{ stats.totalAppointments }}</div><div class="bk-stat-label">Tổng lịch hẹn</div></div>\
    <div class="bk-stat-card bk-stat--today"><div class="bk-stat-num">{{ stats.todayAppointments }}</div><div class="bk-stat-label">Hôm nay</div></div>\
    <div class="bk-stat-card bk-stat--pending"><div class="bk-stat-num">{{ stats.pending }}</div><div class="bk-stat-label">Đang chờ</div></div>\
    <div class="bk-stat-card bk-stat--revenue"><div class="bk-stat-num">{{ fmtMoney(stats.revenue) }}</div><div class="bk-stat-label">Doanh thu</div></div>\
    <div class="bk-stat-card"><div class="bk-stat-num">{{ stats.totalServices }}</div><div class="bk-stat-label">Dịch vụ</div></div>\
  </div>\
</div>'
  };

  // ══════════════════════════════════════
  // Services CRUD
  // ══════════════════════════════════════
  var BookingServices = {
    name: 'BookingServices',
    setup: function() {
      var items = e.ref([]);
      var loading = e.ref(true);
      var showModal = e.ref(false);
      var editing = e.ref(null);
      var form = e.ref({});

      e.onMounted(load);
      async function load() {
        loading.value = true;
        try { var r = await apiFetch('/booking/services'); var d = await r.json(); items.value = d.data || d; }
        catch(err) { items.value = []; }
        loading.value = false;
      }
      function openCreate() { editing.value = null; form.value = { title:'', description:'', duration_minutes:60, buffer_minutes:0, price:0, category:'', max_bookings_per_slot:1, is_active:true }; showModal.value = true; }
      function openEdit(item) { editing.value = item.id; form.value = Object.assign({}, item); showModal.value = true; }
      async function save() {
        try {
          var method = editing.value ? 'PUT' : 'POST';
          var url = editing.value ? '/booking/services/' + editing.value : '/booking/services';
          await apiFetch(url, { method: method, body: JSON.stringify(form.value) });
          showToast(editing.value ? 'Đã cập nhật' : 'Đã tạo dịch vụ', 'success');
          showModal.value = false; load();
        } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
      }
      async function remove(id) {
        if (!confirm('Xoá dịch vụ này?')) return;
        try { await apiFetch('/booking/services/' + id, { method: 'DELETE' }); showToast('Đã xoá', 'success'); load(); }
        catch(err) { showToast('Lỗi', 'error'); }
      }
      return { items, loading, showModal, editing, form, openCreate, openEdit, save, remove, fmtMoney };
    },
    template: '\
<div class="bk-section">\
  <div class="bk-header"><h3>Dịch vụ</h3><button class="bk-btn-primary" @click="openCreate">+ Thêm dịch vụ</button></div>\
  <div v-if="loading" class="bk-loading">Đang tải...</div>\
  <table v-else class="bk-table">\
    <thead><tr><th>Tên</th><th>Thời lượng</th><th>Buffer</th><th>Giá</th><th>Danh mục</th><th>Max/slot</th><th>Trạng thái</th><th></th></tr></thead>\
    <tbody>\
      <tr v-for="s in items" :key="s.id">\
        <td><strong>{{ s.title }}</strong></td>\
        <td>{{ s.duration_minutes }} phút</td>\
        <td>{{ s.buffer_minutes || 0 }} phút</td>\
        <td>{{ fmtMoney(s.price) }}</td>\
        <td>{{ s.category || "-" }}</td>\
        <td>{{ s.max_bookings_per_slot || 1 }}</td>\
        <td><span class="bk-badge" :class="s.is_active ? \'bk-badge--active\' : \'bk-badge--inactive\'">{{ s.is_active ? "Hoạt động" : "Tắt" }}</span></td>\
        <td><button @click="openEdit(s)"></button> <button class="bk-btn-del" @click="remove(s.id)"></button></td>\
      </tr>\
      <tr v-if="!items.length"><td colspan="8" class="bk-empty">Chưa có dịch vụ</td></tr>\
    </tbody>\
  </table>\
  <div v-if="showModal" class="bk-modal-overlay" @click.self="showModal=false">\
    <div class="bk-modal">\
      <h4>{{ editing ? "Sửa dịch vụ" : "Thêm dịch vụ" }}</h4>\
      <div class="bk-form">\
        <label>Tên dịch vụ <input v-model="form.title" class="bk-input" /></label>\
        <label>Mô tả <textarea v-model="form.description" class="bk-input bk-textarea"></textarea></label>\
        <div class="bk-form-row">\
          <label>Thời lượng (phút) <input v-model.number="form.duration_minutes" type="number" class="bk-input" /></label>\
          <label>Buffer (phút) <input v-model.number="form.buffer_minutes" type="number" class="bk-input" /></label>\
        </div>\
        <div class="bk-form-row">\
          <label>Giá <input v-model.number="form.price" type="number" class="bk-input" /></label>\
          <label>Max bookings/slot <input v-model.number="form.max_bookings_per_slot" type="number" class="bk-input" /></label>\
        </div>\
        <label>Danh mục <input v-model="form.category" class="bk-input" /></label>\
        <label class="bk-check"><input type="checkbox" v-model="form.is_active" /> Kích hoạt</label>\
      </div>\
      <div class="bk-modal-actions"><button class="bk-btn-primary" @click="save">Lưu</button><button @click="showModal=false">Huỷ</button></div>\
    </div>\
  </div>\
</div>'
  };

  // ══════════════════════════════════════
  // Appointments Management
  // ══════════════════════════════════════
  var BookingAppointments = {
    name: 'BookingAppointments',
    setup: function() {
      var items = e.ref([]);
      var loading = e.ref(true);
      var filter = e.ref({ status: '', date: '', search: '' });
      var showModal = e.ref(false);
      var form = e.ref({});
      var services = e.ref([]);

      e.onMounted(function() { load(); loadServices(); });
      async function loadServices() {
        try { var r = await apiFetch('/booking/services'); var d = await r.json(); services.value = d.data || d; } catch(e) {}
      }
      async function load() {
        loading.value = true;
        var params = [];
        if (filter.value.status) params.push('status=' + filter.value.status);
        if (filter.value.date) params.push('date=' + filter.value.date);
        if (filter.value.search) params.push('search=' + filter.value.search);
        try { var r = await apiFetch('/booking/appointments?' + params.join('&')); var d = await r.json(); items.value = d.data || d; }
        catch(err) { items.value = []; }
        loading.value = false;
      }
      function openCreate() { form.value = { service_id:'', customer_name:'', customer_phone:'', customer_email:'', date:'', time_slot:'', notes:'' }; showModal.value = true; }
      async function save() {
        try {
          await apiFetch('/booking/appointments', { method: 'POST', body: JSON.stringify(form.value) });
          showToast('Đã tạo lịch hẹn', 'success'); showModal.value = false; load();
        } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
      }
      async function updateStatus(id, status) {
        try { await apiFetch('/booking/appointments/' + id, { method: 'PUT', body: JSON.stringify({ status: status }) }); showToast('Đã cập nhật', 'success'); load(); }
        catch(err) { showToast('Lỗi', 'error'); }
      }
      async function remove(id) {
        if (!confirm('Xoá lịch hẹn này?')) return;
        try { await apiFetch('/booking/appointments/' + id, { method: 'DELETE' }); showToast('Đã xoá', 'success'); load(); }
        catch(err) { showToast('Lỗi', 'error'); }
      }
      return { items, loading, filter, showModal, form, services, openCreate, save, updateStatus, remove, load, fmtDate, fmtMoney, STATUS_MAP };
    },
    template: '\
<div class="bk-section">\
  <div class="bk-header"><h3>Lịch hẹn</h3><button class="bk-btn-primary" @click="openCreate">+ Tạo lịch hẹn</button></div>\
  <div class="bk-filters">\
    <select v-model="filter.status" @change="load" class="bk-input"><option value="">Tất cả</option><option value="pending">Chờ</option><option value="confirmed">Xác nhận</option><option value="completed">Hoàn thành</option><option value="cancelled">Huỷ</option></select>\
    <input v-model="filter.date" type="date" @change="load" class="bk-input" />\
    <input v-model="filter.search" @input="load" class="bk-input" placeholder="Tìm tên, SĐT..." />\
  </div>\
  <div v-if="loading" class="bk-loading">Đang tải...</div>\
  <table v-else class="bk-table">\
    <thead><tr><th>Khách hàng</th><th>SĐT</th><th>Dịch vụ</th><th>Ngày</th><th>Giờ</th><th>Trạng thái</th><th></th></tr></thead>\
    <tbody>\
      <tr v-for="a in items" :key="a.id">\
        <td><strong>{{ a.customer_name }}</strong></td>\
        <td>{{ a.customer_phone || "-" }}</td>\
        <td>{{ a.service ? a.service.title : "-" }}</td>\
        <td>{{ fmtDate(a.date) }}</td>\
        <td>{{ a.time_slot }}</td>\
        <td>\
          <select :value="a.status" @change="updateStatus(a.id, $event.target.value)" class="bk-status-sel">\
            <option value="pending">Chờ xử lý</option><option value="confirmed">Xác nhận</option>\
            <option value="completed">Hoàn thành</option><option value="cancelled">Đã huỷ</option><option value="no_show">Vắng mặt</option>\
          </select>\
        </td>\
        <td><button class="bk-btn-del" @click="remove(a.id)"></button></td>\
      </tr>\
      <tr v-if="!items.length"><td colspan="7" class="bk-empty">Không có lịch hẹn</td></tr>\
    </tbody>\
  </table>\
  <div v-if="showModal" class="bk-modal-overlay" @click.self="showModal=false">\
    <div class="bk-modal">\
      <h4>Tạo lịch hẹn</h4>\
      <div class="bk-form">\
        <label>Dịch vụ <select v-model="form.service_id" class="bk-input"><option value="">-- Chọn --</option><option v-for="s in services" :key="s.id" :value="s.id">{{ s.title }}</option></select></label>\
        <label>Tên khách <input v-model="form.customer_name" class="bk-input" /></label>\
        <div class="bk-form-row">\
          <label>SĐT <input v-model="form.customer_phone" class="bk-input" /></label>\
          <label>Email <input v-model="form.customer_email" class="bk-input" type="email" /></label>\
        </div>\
        <div class="bk-form-row">\
          <label>Ngày <input v-model="form.date" type="date" class="bk-input" /></label>\
          <label>Giờ <input v-model="form.time_slot" class="bk-input" placeholder="09:00" /></label>\
        </div>\
        <label>Ghi chú <textarea v-model="form.notes" class="bk-input bk-textarea"></textarea></label>\
      </div>\
      <div class="bk-modal-actions"><button class="bk-btn-primary" @click="save">Lưu</button><button @click="showModal=false">Huỷ</button></div>\
    </div>\
  </div>\
</div>'
  };

  // ══════════════════════════════════════
  // Main Manager
  // ══════════════════════════════════════
  var BookingManager = {
    name: 'BookingManager',
    components: { BookingStats: BookingStats, BookingServices: BookingServices, BookingAppointments: BookingAppointments },
    setup: function() {
      var tab = e.ref('stats');
      return { tab };
    },
    template: '\
<div class="booking-plugin">\
  <div class="bk-tabs">\
    <button :class="{\'bk-tab-active\': tab===\'stats\'}" @click="tab=\'stats\'">Tổng quan</button>\
    <button :class="{\'bk-tab-active\': tab===\'services\'}" @click="tab=\'services\'">Dịch vụ</button>\
    <button :class="{\'bk-tab-active\': tab===\'appointments\'}" @click="tab=\'appointments\'">Lịch hẹn</button>\
  </div>\
  <BookingStats v-if="tab===\'stats\'" />\
  <BookingServices v-else-if="tab===\'services\'" />\
  <BookingAppointments v-else-if="tab===\'appointments\'" />\
</div>'
  };

  // ── Register ──
  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) {
      items.push(
        {key:'booking/dashboard',label:'Đặt lịch',icon:'CalendarDays',featureGroup:'store',moduleId:'booking'},
        {key:'booking/services',label:'Dịch vụ',icon:'Briefcase',featureGroup:'store',moduleId:'booking'},
        {key:'booking/appointments',label:'Lịch hẹn',icon:'Calendar',featureGroup:'store',moduleId:'booking'}
      );
      return items;
    });
    hooks.addFilter('admin_routes', function(config) {
      Object.assign(config.routeToTab, {'booking/dashboard':'booking','booking/services':'booking','booking/appointments':'booking'});
      return config;
    });
  }

  var plugin = {
    id: 'booking',
    name: 'Đặt lịch & Dịch vụ',
    version: '2.0.0',
    components: { 'booking': e.markRaw(BookingManager) },
    sidebar: { group: 'Đặt lịch', items: [
      { key: 'booking-dashboard', label: 'Tổng quan', icon: 'BarChart3', route: 'booking/dashboard' },
      { key: 'booking-services', label: 'Dịch vụ', icon: 'Briefcase', route: 'booking/services' },
      { key: 'booking-appointments', label: 'Lịch hẹn', icon: 'CalendarDays', route: 'booking/appointments' }
    ]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['booking'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'booking', plugin: plugin } }));
  return plugin;
})(Vue);
