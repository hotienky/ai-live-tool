/**
 * Events Plugin — Full Admin UI
 * Event management, tickets, registrations, check-in, stats
 */
var Plugin_events = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  var t = (bridge && bridge.t) || function(k, d) { return d; };

  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  // ── Stats ──
  var EventStats = {
    name: 'EventStats',
    setup: function() {
      var stats = e.ref(null); var loading = e.ref(true);
      e.onMounted(async function() {
        try { var r = await apiFetch('/events/stats'); stats.value = (await r.json()).data; }
        catch(err) {} loading.value = false;
      });
      return { stats, loading, fmtMoney };
    },
    template: '\
<div class="ev-stats">\
  <div v-if="loading" class="ev-loading">Đang tải...</div>\
  <div v-else-if="stats" class="ev-stats-grid">\
    <div class="ev-stat-card"><div class="ev-stat-num">{{ stats.totalEvents }}</div><div class="ev-stat-label">Sự kiện</div></div>\
    <div class="ev-stat-card"><div class="ev-stat-num">{{ stats.totalRegistrations }}</div><div class="ev-stat-label">Đăng ký</div></div>\
    <div class="ev-stat-card"><div class="ev-stat-num">{{ stats.checkedIn }}</div><div class="ev-stat-label">Đã check-in</div></div>\
    <div class="ev-stat-card"><div class="ev-stat-num">{{ fmtMoney(stats.ticketRevenue) }}</div><div class="ev-stat-label">Doanh thu vé</div></div>\
  </div>\
</div>'
  };

  // ── Tickets Manager ──
  var EventTickets = {
    name: 'EventTickets',
    props: { eventId: [String, Number] },
    setup: function(props) {
      var tickets = e.ref([]); var loading = e.ref(true);
      var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
      e.onMounted(load);
      async function load() {
        loading.value = true;
        try { var r = await apiFetch('/events/' + props.eventId + '/tickets'); var d = await r.json(); tickets.value = d.data || d; }
        catch(err) { tickets.value = []; } loading.value = false;
      }
      function openCreate() { editing.value = null; form.value = { name: '', type: 'paid', price: 0, quantity: 100, is_active: true }; showModal.value = true; }
      function openEdit(item) { editing.value = item.id; form.value = Object.assign({}, item); showModal.value = true; }
      async function save() {
        try {
          var method = editing.value ? 'PUT' : 'POST';
          var url = editing.value ? '/events/' + props.eventId + '/tickets/' + editing.value : '/events/' + props.eventId + '/tickets';
          await apiFetch(url, { method: method, body: JSON.stringify(form.value) });
          showToast('Đã lưu', 'success'); showModal.value = false; load();
        } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
      }
      async function remove(id) {
        if (!confirm('Xoá vé?')) return;
        try { await apiFetch('/events/' + props.eventId + '/tickets/' + id, { method: 'DELETE' }); showToast('Đã xoá', 'success'); load(); }
        catch(err) { showToast('Lỗi', 'error'); }
      }
      return { tickets, loading, showModal, form, editing, openCreate, openEdit, save, remove, fmtMoney };
    },
    template: '\
<div class="ev-tickets">\
  <div class="ev-header"><h4>🎫 Vé sự kiện</h4><button class="ev-btn-primary" @click="openCreate">+ Thêm vé</button></div>\
  <table class="ev-table">\
    <thead><tr><th>Tên vé</th><th>Loại</th><th>Giá</th><th>SL</th><th>Đã bán</th><th>Trạng thái</th><th></th></tr></thead>\
    <tbody>\
      <tr v-for="tk in tickets" :key="tk.id">\
        <td>{{ tk.name }}</td><td>{{ tk.type }}</td><td>{{ fmtMoney(tk.price) }}</td>\
        <td>{{ tk.quantity }}</td><td>{{ tk.sold_count || 0 }}</td>\
        <td><span :class="tk.is_active ? \'ev-badge-active\' : \'ev-badge-inactive\'">{{ tk.is_active ? "Active" : "Tắt" }}</span></td>\
        <td><button @click="openEdit(tk)">✏️</button> <button class="ev-btn-del" @click="remove(tk.id)">🗑</button></td>\
      </tr>\
    </tbody>\
  </table>\
  <div v-if="showModal" class="ev-modal-overlay" @click.self="showModal=false">\
    <div class="ev-modal"><h4>{{ editing ? "Sửa vé" : "Thêm vé" }}</h4>\
      <label>Tên <input v-model="form.name" class="ev-input" /></label>\
      <label>Loại <select v-model="form.type" class="ev-input"><option value="free">Miễn phí</option><option value="paid">Có phí</option><option value="vip">VIP</option></select></label>\
      <label>Giá <input v-model.number="form.price" type="number" class="ev-input" /></label>\
      <label>Số lượng <input v-model.number="form.quantity" type="number" class="ev-input" /></label>\
      <label class="ev-check"><input type="checkbox" v-model="form.is_active" /> Kích hoạt</label>\
      <div class="ev-modal-actions"><button class="ev-btn-primary" @click="save">💾 Lưu</button><button @click="showModal=false">Huỷ</button></div>\
    </div>\
  </div>\
</div>'
  };

  // ── Registrations ──
  var EventRegistrations = {
    name: 'EventRegistrations',
    props: { eventId: [String, Number] },
    setup: function(props) {
      var items = e.ref([]); var loading = e.ref(true);
      e.onMounted(load);
      async function load() {
        loading.value = true;
        try { var r = await apiFetch('/events/' + props.eventId + '/registrations'); var d = await r.json(); items.value = d.data || d; }
        catch(err) { items.value = []; } loading.value = false;
      }
      async function checkIn(id) {
        try { await apiFetch('/events/' + props.eventId + '/registrations/' + id + '/check-in', { method: 'POST' }); showToast('Đã check-in', 'success'); load(); }
        catch(err) { showToast('Lỗi', 'error'); }
      }
      return { items, loading, checkIn, fmtDate };
    },
    template: '\
<div class="ev-regs">\
  <h4>👥 Danh sách đăng ký</h4>\
  <div v-if="loading" class="ev-loading">Đang tải...</div>\
  <table v-else class="ev-table">\
    <thead><tr><th>Tên</th><th>Email</th><th>Vé</th><th>Mã</th><th>Check-in</th><th></th></tr></thead>\
    <tbody>\
      <tr v-for="r in items" :key="r.id">\
        <td>{{ r.attendee_name }}</td><td>{{ r.attendee_email }}</td>\
        <td>{{ r.ticket ? r.ticket.name : "-" }}</td><td><code>{{ r.registration_code }}</code></td>\
        <td>{{ r.checked_in_at ? fmtDate(r.checked_in_at) : "❌" }}</td>\
        <td><button v-if="!r.checked_in_at" class="ev-btn-primary" @click="checkIn(r.id)">✅ Check-in</button><span v-else>✅</span></td>\
      </tr>\
    </tbody>\
  </table>\
</div>'
  };

  // ── Main Manager ──
  var EventsManager = {
    name: 'EventsManager',
    components: { EventStats: EventStats, EventTickets: EventTickets, EventRegistrations: EventRegistrations },
    setup: function() {
      var tab = e.ref('stats');
      var events = e.ref([]); var loading = e.ref(true);
      var selectedEvent = e.ref(null);
      e.onMounted(loadEvents);
      async function loadEvents() {
        loading.value = true;
        try { var r = await apiFetch('/events'); var d = await r.json(); events.value = d.data || d; }
        catch(err) {} loading.value = false;
      }
      function selectEvent(ev) { selectedEvent.value = ev; tab.value = 'tickets'; }
      return { tab, events, loading, selectedEvent, selectEvent, fmtDate };
    },
    template: '\
<div class="events-plugin">\
  <div class="ev-tabs">\
    <button :class="{\'ev-tab-active\': tab===\'stats\'}" @click="tab=\'stats\'">📊 Tổng quan</button>\
    <button :class="{\'ev-tab-active\': tab===\'list\'}" @click="tab=\'list\'">📋 Sự kiện</button>\
    <button v-if="selectedEvent" :class="{\'ev-tab-active\': tab===\'tickets\'}" @click="tab=\'tickets\'">🎫 Vé</button>\
    <button v-if="selectedEvent" :class="{\'ev-tab-active\': tab===\'regs\'}" @click="tab=\'regs\'">👥 Đăng ký</button>\
  </div>\
  <EventStats v-if="tab===\'stats\'" />\
  <div v-else-if="tab===\'list\'">\
    <h3>📋 Danh sách sự kiện</h3>\
    <table class="ev-table"><thead><tr><th>Tên</th><th>Ngày</th><th>Đăng ký</th><th></th></tr></thead>\
    <tbody><tr v-for="ev in events" :key="ev.id"><td>{{ ev.title }}</td><td>{{ fmtDate(ev.created_at) }}</td><td>{{ ev.registrations_count || 0 }}</td>\
    <td><button class="ev-btn-primary" @click="selectEvent(ev)">Quản lý</button></td></tr></tbody></table>\
  </div>\
  <EventTickets v-else-if="tab===\'tickets\' && selectedEvent" :eventId="selectedEvent.id" />\
  <EventRegistrations v-else-if="tab===\'regs\' && selectedEvent" :eventId="selectedEvent.id" />\
</div>'
  };

  // ── Register ──
  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) {
      items.push({key:'events/dashboard',label:'Sự kiện',icon:'CalendarPlus',featureGroup:'store',moduleId:'events'});
      return items;
    });
    hooks.addFilter('admin_routes', function(config) {
      Object.assign(config.routeToTab, {'events/dashboard':'events','events/list':'events','events/tickets':'events'});
      return config;
    });
  }
  var plugin = { id: 'events', name: 'Quản lý Sự kiện', version: '2.0.0',
    components: { 'events': e.markRaw(EventsManager) },
    sidebar: { group: 'Sự kiện', items: [{ key: 'events-dashboard', label: 'Sự kiện', icon: 'CalendarPlus', route: 'events/dashboard' }]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['events'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'events', plugin: plugin } }));
  return plugin;
})(Vue);
