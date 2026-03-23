/**
 * Membership Plugin — Full Admin UI
 * Tiers, Members, Points, Referrals, Stats
 */
var Plugin_membership = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var MemberStats = { name: 'MemberStats', setup: function() {
    var stats = e.ref(null); var loading = e.ref(true);
    e.onMounted(async function() { try { var r = await apiFetch('/membership/stats'); stats.value = (await r.json()).data; } catch(e) {} loading.value = false; });
    return { stats, loading };
  }, template: '<div class="mb-stats"><div v-if="loading" class="mb-loading">Đang tải...</div><div v-else-if="stats" class="mb-stats-grid">\
    <div class="mb-stat-card"><div class="mb-stat-num">{{ stats.totalMembers }}</div><div class="mb-stat-label">Thành viên</div></div>\
    <div class="mb-stat-card"><div class="mb-stat-num">{{ stats.activeMembers }}</div><div class="mb-stat-label">Hoạt động</div></div>\
    <div class="mb-stat-card"><div class="mb-stat-num">{{ stats.totalPointsIssued }}</div><div class="mb-stat-label">Điểm phát</div></div>\
    <div class="mb-stat-card"><div class="mb-stat-num">{{ stats.totalPointsRedeemed }}</div><div class="mb-stat-label">Điểm đổi</div></div>\
    <div class="mb-stat-card"><div class="mb-stat-num">{{ stats.totalReferrals }}</div><div class="mb-stat-label">Giới thiệu</div></div>\
  </div></div>' };

  var MemberTiers = { name: 'MemberTiers', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/membership/tiers'); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { name:'', min_points:0, discount_percent:0, benefits:'', color:'#6366f1', is_active:true }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/membership/tiers/' + editing.value : '/membership/tiers';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/membership/tiers/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, showModal, form, editing, openCreate, openEdit, save, remove };
  }, template: '\
<div class="mb-section"><div class="mb-header"><h3> Hạng thành viên</h3><button class="mb-btn-primary" @click="openCreate">+ Thêm hạng</button></div>\
  <div class="mb-tier-grid"><div v-for="t in items" :key="t.id" class="mb-tier-card" :style="{borderLeft: \'4px solid \' + (t.color || \'#6366f1\')}">\
    <div class="mb-tier-name" :style="{color: t.color}">{{ t.name }}</div>\
    <div class="mb-tier-info">Điểm tối thiểu: <strong>{{ t.min_points }}</strong></div>\
    <div class="mb-tier-info">Giảm giá: <strong>{{ t.discount_percent }}%</strong></div>\
    <div class="mb-tier-info">Thành viên: <strong>{{ t.members_count || 0 }}</strong></div>\
    <div v-if="t.benefits" class="mb-tier-benefits">{{ t.benefits }}</div>\
    <div class="mb-tier-acts"><button @click="openEdit(t)"></button><button class="mb-btn-del" @click="remove(t.id)"></button></div></div></div>\
  <div v-if="showModal" class="mb-modal-overlay" @click.self="showModal=false"><div class="mb-modal"><h4>{{ editing ? "Sửa" : "Thêm" }} hạng</h4>\
    <label>Tên <input v-model="form.name" class="mb-input" /></label>\
    <div class="mb-form-row"><label>Điểm tối thiểu <input v-model.number="form.min_points" type="number" class="mb-input" /></label>\
      <label>Giảm giá (%) <input v-model.number="form.discount_percent" type="number" class="mb-input" /></label></div>\
    <label>Quyền lợi <textarea v-model="form.benefits" class="mb-input mb-textarea"></textarea></label>\
    <label>Màu <input v-model="form.color" type="color" class="mb-input" style="width:80px;height:40px" /></label>\
    <label class="mb-check"><input type="checkbox" v-model="form.is_active" /> Kích hoạt</label>\
    <div class="mb-modal-actions"><button class="mb-btn-primary" @click="save">Lưu</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var MemberList = { name: 'MemberList', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var filter = e.ref({ tier:'', search:'' }); var tiers = e.ref([]);
    e.onMounted(function() { load(); loadTiers(); });
    async function loadTiers() { try { var r = await apiFetch('/membership/tiers'); tiers.value = (await r.json()).data || []; } catch(e) {} }
    async function load() { loading.value = true; var p = [];
      if (filter.value.tier) p.push('tier=' + filter.value.tier);
      if (filter.value.search) p.push('search=' + filter.value.search);
      try { var r = await apiFetch('/membership/members?' + p.join('&')); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    async function adjustPoints(id, amount, reason) {
      try { await apiFetch('/membership/members/' + id + '/points', { method:'POST', body:JSON.stringify({ amount:amount, reason:reason }) }); showToast('Đã cập nhật điểm','success'); load(); }
      catch(e) { showToast('Lỗi','error'); } }
    var pointModal = e.ref(false); var pointForm = e.ref({ memberId:null, amount:0, reason:'' });
    function openPointModal(m) { pointForm.value = { memberId:m.id, amount:0, reason:'' }; pointModal.value = true; }
    function savePoints() { adjustPoints(pointForm.value.memberId, pointForm.value.amount, pointForm.value.reason); pointModal.value = false; }
    return { items, loading, filter, tiers, load, openPointModal, pointModal, pointForm, savePoints, fmtDate };
  }, template: '\
<div class="mb-section"><div class="mb-header"><h3>Thành viên</h3></div>\
  <div class="mb-filters"><select v-model="filter.tier" @change="load" class="mb-input"><option value="">Tất cả hạng</option><option v-for="t in tiers" :key="t.id" :value="t.id">{{ t.name }}</option></select>\
    <input v-model="filter.search" @input="load" class="mb-input" placeholder="Tìm tên/email..." /></div>\
  <table class="mb-table"><thead><tr><th>Tên</th><th>Email</th><th>Hạng</th><th>Điểm</th><th>Tổng chi</th><th>Giới thiệu</th><th>Ngày</th><th></th></tr></thead>\
  <tbody><tr v-for="m in items" :key="m.id"><td><strong>{{ m.name }}</strong></td><td>{{ m.email || "-" }}</td>\
    <td><span class="mb-tier-badge" :style="{background: m.tier_color || \'#6366f1\'}">{{ m.tier_name || m.current_tier || "Cơ bản" }}</span></td>\
    <td>{{ m.points || 0 }}</td><td>{{ m.total_spent || 0 }}</td><td>{{ m.referral_count || 0 }}</td><td>{{ fmtDate(m.created_at) }}</td>\
    <td><button class="mb-btn-primary" @click="openPointModal(m)"> Điểm</button></td></tr></tbody></table>\
  <div v-if="pointModal" class="mb-modal-overlay" @click.self="pointModal=false"><div class="mb-modal"><h4>Điều chỉnh điểm</h4>\
    <label>Số điểm (+/-) <input v-model.number="pointForm.amount" type="number" class="mb-input" /></label>\
    <label>Lý do <input v-model="pointForm.reason" class="mb-input" placeholder="VD: Bonus sinh nhật" /></label>\
    <div class="mb-modal-actions"><button class="mb-btn-primary" @click="savePoints">Lưu</button><button @click="pointModal=false">Huỷ</button></div></div></div>\
</div>' };

  var MemberManager = { name: 'MemberManager',
    components: { MemberStats:MemberStats, MemberTiers:MemberTiers, MemberList:MemberList },
    setup: function() { var tab = e.ref('stats'); return { tab }; },
    template: '<div class="membership-plugin"><div class="mb-tabs">\
      <button :class="{\'mb-tab-active\':tab===\'stats\'}" @click="tab=\'stats\'">Tổng quan</button>\
      <button :class="{\'mb-tab-active\':tab===\'tiers\'}" @click="tab=\'tiers\'"> Hạng</button>\
      <button :class="{\'mb-tab-active\':tab===\'members\'}" @click="tab=\'members\'">Thành viên</button></div>\
      <MemberStats v-if="tab===\'stats\'" /><MemberTiers v-else-if="tab===\'tiers\'" />\
      <MemberList v-else-if="tab===\'members\'" /></div>' };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) { items.push({key:'membership/dashboard',label:'Thành viên',icon:'Crown',featureGroup:'store',moduleId:'membership'}); return items; });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'membership/dashboard':'membership'}); return c; });
  }
  var plugin = { id:'membership', name:'Quản lý Thành viên', version:'2.0.0',
    components: {'membership': e.markRaw(MemberManager) },
    sidebar: {group:'Khách hàng', items:[{key:'membership-dashboard',label:'Thành viên',icon:'Crown',route:'membership/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['membership'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'membership', plugin: plugin } }));
  return plugin;
})(Vue);
