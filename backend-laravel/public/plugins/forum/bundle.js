/**
 * Forum Plugin — Full Admin UI
 * Categories, Threads, Moderation, Stats
 */
var Plugin_forum = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }

  var ForumStats = { name: 'ForumStats', setup: function() {
    var stats = e.ref(null); var loading = e.ref(true);
    e.onMounted(async function() { try { var r = await apiFetch('/forum/stats'); stats.value = (await r.json()).data; } catch(e) {} loading.value = false; });
    return { stats, loading };
  }, template: '<div class="fm-stats"><div v-if="loading" class="fm-loading">Đang tải...</div><div v-else-if="stats" class="fm-stats-grid">\
    <div class="fm-stat-card"><div class="fm-stat-num">{{ stats.totalCategories }}</div><div class="fm-stat-label">Chuyên mục</div></div>\
    <div class="fm-stat-card"><div class="fm-stat-num">{{ stats.totalThreads }}</div><div class="fm-stat-label">Chủ đề</div></div>\
    <div class="fm-stat-card"><div class="fm-stat-num">{{ stats.totalPosts }}</div><div class="fm-stat-label">Bài viết</div></div>\
    <div class="fm-stat-card"><div class="fm-stat-num">{{ stats.totalMembers }}</div><div class="fm-stat-label">Thành viên</div></div>\
  </div></div>' };

  var ForumCategories = { name: 'ForumCategories', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/forum/categories'); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { name:'', description:'', sort_order:0, is_active:true }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/forum/categories/' + editing.value : '/forum/categories';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/forum/categories/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, showModal, form, editing, openCreate, openEdit, save, remove };
  }, template: '\
<div class="fm-section"><div class="fm-header"><h3> Chuyên mục</h3><button class="btn-primary btn-sm" @click="openCreate">+ Thêm</button></div>\
  <table class="fm-table"><thead><tr><th>Tên</th><th>Mô tả</th><th>Chủ đề</th><th>Thứ tự</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="c in items" :key="c.id"><td><strong>{{ c.name }}</strong></td><td>{{ c.description || "-" }}</td>\
    <td>{{ c.threads_count || 0 }}</td><td>{{ c.sort_order }}</td>\
    <td><span :class="c.is_active ? \'fm-badge-on\' : \'fm-badge-off\'">{{ c.is_active ? "" : "" }}</span></td>\
    <td><button class="btn-ghost btn-sm" style="color:var(--plugin-blue)" @click="openEdit(c)">Sửa</button><button class="btn-ghost btn-sm" style="color:var(--plugin-red)" @click="remove(c.id)">Xoá</button></td></tr></tbody></table>\
  <div v-if="showModal" class="modal-overlay" @click.self="showModal=false"><div class="modal"><h4>{{ editing ? "Sửa" : "Thêm" }}</h4>\
    <label>Tên <input v-model="form.name" class="fm-input" /></label>\
    <label>Mô tả <textarea v-model="form.description" class="fm-input fm-textarea"></textarea></label>\
    <label>Thứ tự <input v-model.number="form.sort_order" type="number" class="fm-input" /></label>\
    <label class="fm-check"><input type="checkbox" v-model="form.is_active" /> Kích hoạt</label>\
    <div class="modal-actions"><button class="btn-save" @click="save">Lưu</button><button class="btn-cancel" @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var ForumThreads = { name: 'ForumThreads', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var filter = e.ref({ status:'', search:'' });
    e.onMounted(load);
    async function load() { loading.value = true; var p = [];
      if (filter.value.status) p.push('status=' + filter.value.status);
      if (filter.value.search) p.push('search=' + filter.value.search);
      try { var r = await apiFetch('/forum/threads?' + p.join('&')); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    async function updateStatus(id, s) { try { await apiFetch('/forum/threads/' + id, { method:'PUT', body:JSON.stringify({ status:s }) }); showToast('Đã cập nhật','success'); load(); } catch(e) {} }
    async function pin(id, val) { try { await apiFetch('/forum/threads/' + id, { method:'PUT', body:JSON.stringify({ is_pinned: val }) }); load(); } catch(e) {} }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/forum/threads/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, filter, updateStatus, pin, remove, load, fmtDate };
  }, template: '\
<div class="fm-section"><div class="fm-header"><h3> Chủ đề</h3></div>\
  <div class="fm-filters"><select v-model="filter.status" @change="load" class="fm-input"><option value="">Tất cả</option><option value="open">Mở</option><option value="closed">Đóng</option><option value="locked">Khoá</option></select>\
    <input v-model="filter.search" @input="load" class="fm-input" placeholder="Tìm..." /></div>\
  <table class="fm-table"><thead><tr><th>Tiêu đề</th><th>Tác giả</th><th>Chuyên mục</th><th>Trả lời</th><th>Lượt xem</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="t in items" :key="t.id"><td><strong>{{ t.title }}</strong><span v-if="t.is_pinned"> </span></td>\
    <td>{{ t.author_name || "-" }}</td><td>{{ t.category ? t.category.name : "-" }}</td>\
    <td>{{ t.replies_count || 0 }}</td><td>{{ t.views_count || 0 }}</td>\
    <td><select :value="t.status" @change="updateStatus(t.id, $event.target.value)" class="fm-status-sel"><option value="open">Mở</option><option value="closed">Đóng</option><option value="locked">Khoá</option></select></td>\
    <td><button @click="pin(t.id, !t.is_pinned)" :title="t.is_pinned ? \'Bỏ ghim\' : \'Ghim\'">{{ t.is_pinned ? "" : "" }}</button>\
      <button class="btn-ghost btn-sm" style="color:var(--plugin-red)" @click="remove(t.id)">Xoá</button></td></tr></tbody></table>\
</div>' };

  var ForumManager = { name: 'ForumManager',
    components: { ForumStats:ForumStats, ForumCategories:ForumCategories, ForumThreads:ForumThreads },
    setup: function() { var tab = e.ref('stats'); return { tab }; },
    template: '<div class="forum-plugin"><div class="fm-tabs">\
      <button :class="{\'fm-tab-active\':tab===\'stats\'}" @click="tab=\'stats\'">Tổng quan</button>\
      <button :class="{\'fm-tab-active\':tab===\'categories\'}" @click="tab=\'categories\'"> Chuyên mục</button>\
      <button :class="{\'fm-tab-active\':tab===\'threads\'}" @click="tab=\'threads\'"> Chủ đề</button></div>\
      <ForumStats v-if="tab===\'stats\'" /><ForumCategories v-else-if="tab===\'categories\'" />\
      <ForumThreads v-else-if="tab===\'threads\'" /></div>' };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) { items.push({key:'forum/dashboard',label:'Diễn đàn',icon:'MessagesSquare',featureGroup:'store',moduleId:'forum'}); return items; });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'forum/dashboard':'forum'}); return c; });
  }
  var plugin = { id:'forum', name:'Quản lý Diễn đàn', version:'2.0.0',
    components: {'forum': e.markRaw(ForumManager) },
    sidebar: {group:'Cộng đồng', items:[{key:'forum-dashboard',label:'Diễn đàn',icon:'MessagesSquare',route:'forum/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['forum'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'forum', plugin: plugin } }));
  return plugin;
})(Vue);
