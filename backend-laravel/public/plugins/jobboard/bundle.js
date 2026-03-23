/**
 * Job Board Plugin — Full Admin UI
 * Jobs, Applications, Categories, Stats
 */
var Plugin_jobboard = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var JobStats = { name: 'JobStats', setup: function() {
    var stats = e.ref(null); var loading = e.ref(true);
    e.onMounted(async function() { try { var r = await apiFetch('/jobboard/stats'); stats.value = (await r.json()).data; } catch(e) {} loading.value = false; });
    return { stats, loading };
  }, template: '<div class="jb-stats"><div v-if="loading" class="jb-loading">Đang tải...</div><div v-else-if="stats" class="jb-stats-grid">\
    <div class="jb-stat-card"><div class="jb-stat-num">{{ stats.totalJobs }}</div><div class="jb-stat-label">Tin tuyển dụng</div></div>\
    <div class="jb-stat-card"><div class="jb-stat-num">{{ stats.activeJobs }}</div><div class="jb-stat-label">Đang tuyển</div></div>\
    <div class="jb-stat-card"><div class="jb-stat-num">{{ stats.totalApplications }}</div><div class="jb-stat-label">Đơn ứng tuyển</div></div>\
    <div class="jb-stat-card"><div class="jb-stat-num">{{ stats.newApplications }}</div><div class="jb-stat-label">Đơn mới</div></div>\
  </div></div>' };

  var JobList = { name: 'JobList', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    var filter = e.ref({ status:'', search:'' });
    e.onMounted(load);
    async function load() { loading.value = true; var p = [];
      if (filter.value.status) p.push('status=' + filter.value.status);
      if (filter.value.search) p.push('search=' + filter.value.search);
      try { var r = await apiFetch('/jobboard/jobs?' + p.join('&')); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { title:'', company_name:'', location:'', job_type:'full-time', salary_min:null, salary_max:null, description:'', requirements:'', benefits:'', status:'active', is_featured:false, application_deadline:'' }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/jobboard/jobs/' + editing.value : '/jobboard/jobs';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/jobboard/jobs/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, filter, showModal, form, editing, openCreate, openEdit, save, remove, load, fmtDate, fmtMoney };
  }, template: '\
<div class="jb-section"><div class="jb-header"><h3>Tin tuyển dụng</h3><button class="btn-primary btn-sm" @click="openCreate">+ Đăng tin</button></div>\
  <div class="jb-filters"><select v-model="filter.status" @change="load" class="jb-input"><option value="">Tất cả</option><option value="active">Đang tuyển</option><option value="closed">Đã đóng</option><option value="draft">Nháp</option></select>\
    <input v-model="filter.search" @input="load" class="jb-input" placeholder="Tìm..." /></div>\
  <table class="jb-table"><thead><tr><th>Vị trí</th><th>Công ty</th><th>Địa điểm</th><th>Loại</th><th>Lương</th><th>Đơn</th><th>Hạn</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="j in items" :key="j.id"><td><strong>{{ j.title }}</strong><span v-if="j.is_featured"> ⭐</span></td>\
    <td>{{ j.company_name || "-" }}</td><td>{{ j.location || "-" }}</td>\
    <td>{{ j.job_type }}</td><td>{{ j.salary_min ? fmtMoney(j.salary_min) + " - " + fmtMoney(j.salary_max) : "Thoả thuận" }}</td>\
    <td>{{ j.applications_count || 0 }}</td><td>{{ fmtDate(j.application_deadline) }}</td>\
    <td><span :class="j.status === \'active\' ? \'jb-badge-on\' : \'jb-badge-off\'">{{ j.status }}</span></td>\
    <td><button class="btn-ghost btn-sm" style="color:var(--plugin-blue)" @click="openEdit(j)">Sửa</button><button class="btn-ghost btn-sm" style="color:var(--plugin-red)" @click="remove(j.id)">Xoá</button></td></tr></tbody></table>\
  <div v-if="showModal" class="modal-overlay" @click.self="showModal=false"><div class="modal"><h4>{{ editing ? "Sửa" : "Đăng" }} tin</h4>\
    <label>Vị trí <input v-model="form.title" class="jb-input" /></label>\
    <div class="form-row"><label>Công ty <input v-model="form.company_name" class="jb-input" /></label>\
      <label>Địa điểm <input v-model="form.location" class="jb-input" /></label></div>\
    <div class="form-row"><label>Loại <select v-model="form.job_type" class="jb-input"><option value="full-time">Toàn thời gian</option><option value="part-time">Bán thời gian</option><option value="contract">Hợp đồng</option><option value="freelance">Freelance</option><option value="internship">Thực tập</option></select></label>\
      <label>Hạn nộp <input v-model="form.application_deadline" type="date" class="jb-input" /></label></div>\
    <div class="form-row"><label>Lương tối thiểu <input v-model.number="form.salary_min" type="number" class="jb-input" /></label>\
      <label>Lương tối đa <input v-model.number="form.salary_max" type="number" class="jb-input" /></label></div>\
    <label>Mô tả <textarea v-model="form.description" class="jb-input jb-textarea" rows="4"></textarea></label>\
    <label>Yêu cầu <textarea v-model="form.requirements" class="jb-input jb-textarea" rows="3"></textarea></label>\
    <label>Quyền lợi <textarea v-model="form.benefits" class="jb-input jb-textarea" rows="3"></textarea></label>\
    <div class="form-row"><label>Trạng thái <select v-model="form.status" class="jb-input"><option value="active">Đang tuyển</option><option value="closed">Đã đóng</option><option value="draft">Nháp</option></select></label></div>\
    <label class="jb-check"><input type="checkbox" v-model="form.is_featured" /> Nổi bật</label>\
    <div class="modal-actions"><button class="btn-save" @click="save">Lưu</button><button class="btn-cancel" @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var JobApplications = { name: 'JobApplications', setup: function() {
    var items = e.ref([]); var loading = e.ref(true); var filter = e.ref({ status:'', search:'' });
    e.onMounted(load);
    async function load() { loading.value = true; var p = [];
      if (filter.value.status) p.push('status=' + filter.value.status);
      if (filter.value.search) p.push('search=' + filter.value.search);
      try { var r = await apiFetch('/jobboard/applications?' + p.join('&')); items.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    async function updateStatus(id, s) { try { await apiFetch('/jobboard/applications/' + id, { method:'PUT', body:JSON.stringify({ status:s }) }); showToast('Đã cập nhật','success'); load(); } catch(e) {} }
    return { items, loading, filter, updateStatus, load, fmtDate };
  }, template: '\
<div class="jb-section"><h3> Đơn ứng tuyển</h3>\
  <div class="jb-filters"><select v-model="filter.status" @change="load" class="jb-input"><option value="">Tất cả</option><option value="new">Mới</option><option value="reviewing">Đang xem</option><option value="shortlisted">Chọn lọc</option><option value="interview">Phỏng vấn</option><option value="offered">Đã chọn</option><option value="rejected">Từ chối</option></select>\
    <input v-model="filter.search" @input="load" class="jb-input" placeholder="Tìm..." /></div>\
  <table class="jb-table"><thead><tr><th>Ứng viên</th><th>Email</th><th>SĐT</th><th>Vị trí</th><th>Ngày nộp</th><th>CV</th><th>TT</th></tr></thead>\
  <tbody><tr v-for="a in items" :key="a.id"><td><strong>{{ a.applicant_name }}</strong></td><td>{{ a.applicant_email }}</td><td>{{ a.applicant_phone || "-" }}</td>\
    <td>{{ a.job ? a.job.title : "-" }}</td><td>{{ fmtDate(a.created_at) }}</td>\
    <td><a v-if="a.resume_url" :href="a.resume_url" target="_blank"></a><span v-else>-</span></td>\
    <td><select :value="a.status" @change="updateStatus(a.id, $event.target.value)" class="jb-status-sel"><option value="new">Mới</option><option value="reviewing">Đang xem</option><option value="shortlisted">Chọn lọc</option><option value="interview">PV</option><option value="offered">Đã chọn</option><option value="rejected">Từ chối</option></select></td></tr></tbody></table>\
</div>' };

  var JobManager = { name: 'JobManager',
    components: { JobStats:JobStats, JobList:JobList, JobApplications:JobApplications },
    setup: function() { var tab = e.ref('stats'); return { tab }; },
    template: '<div class="jobboard-plugin"><div class="jb-tabs">\
      <button :class="{\'jb-tab-active\':tab===\'stats\'}" @click="tab=\'stats\'">Tổng quan</button>\
      <button :class="{\'jb-tab-active\':tab===\'jobs\'}" @click="tab=\'jobs\'">Tin tuyển</button>\
      <button :class="{\'jb-tab-active\':tab===\'applications\'}" @click="tab=\'applications\'"> Đơn ứng tuyển</button></div>\
      <JobStats v-if="tab===\'stats\'" /><JobList v-else-if="tab===\'jobs\'" />\
      <JobApplications v-else-if="tab===\'applications\'" /></div>' };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) { items.push({key:'jobboard/dashboard',label:'Tuyển dụng',icon:'Briefcase',featureGroup:'store',moduleId:'jobboard'}); return items; });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'jobboard/dashboard':'jobboard'}); return c; });
  }
  var plugin = { id:'jobboard', name:'Quản lý Tuyển dụng', version:'2.0.0',
    components: {'jobboard': e.markRaw(JobManager) },
    sidebar: {group:'Tuyển dụng', items:[{key:'jobboard-dashboard',label:'Tuyển dụng',icon:'Briefcase',route:'jobboard/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['jobboard'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'jobboard', plugin: plugin } }));
  return plugin;
})(Vue);
