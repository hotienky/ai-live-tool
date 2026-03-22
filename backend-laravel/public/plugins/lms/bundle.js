/**
 * LMS Plugin — Full Admin UI
 * Courses, Sections, Lessons, Quizzes, Enrollments, Stats
 */
var Plugin_lms = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var LmsStats = { name: 'LmsStats', setup: function() {
    var stats = e.ref(null); var loading = e.ref(true);
    e.onMounted(async function() { try { var r = await apiFetch('/lms/stats'); stats.value = (await r.json()).data; } catch(e) {} loading.value = false; });
    return { stats, loading };
  }, template: '<div class="lm-stats"><div v-if="loading" class="lm-loading">Đang tải...</div><div v-else-if="stats" class="lm-stats-grid">\
    <div class="lm-stat-card"><div class="lm-stat-num">{{ stats.totalCourses }}</div><div class="lm-stat-label">Khoá học</div></div>\
    <div class="lm-stat-card"><div class="lm-stat-num">{{ stats.publishedCourses }}</div><div class="lm-stat-label">Đã xuất bản</div></div>\
    <div class="lm-stat-card"><div class="lm-stat-num">{{ stats.totalEnrollments }}</div><div class="lm-stat-label">Ghi danh</div></div>\
    <div class="lm-stat-card"><div class="lm-stat-num">{{ stats.completedEnrollments }}</div><div class="lm-stat-label">Hoàn thành</div></div>\
    <div class="lm-stat-card"><div class="lm-stat-num">{{ stats.totalLessons }}</div><div class="lm-stat-label">Bài học</div></div>\
  </div></div>' };

  var LmsCourses = { name: 'LmsCourses', emits: ['selectCourse'], setup: function(_, ctx) {
    var courses = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/lms/courses'); courses.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { title:'', description:'', price:0, is_published:false, instructor_name:'', level:'beginner', certificate_enabled:false }; showModal.value = true; }
    function openEdit(c) { editing.value = c.id; form.value = Object.assign({}, c); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/lms/courses/' + editing.value : '/lms/courses';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/lms/courses/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { courses, loading, showModal, form, editing, openCreate, openEdit, save, remove, fmtMoney };
  }, template: '\
<div class="lm-section"><div class="lm-header"><h3>📚 Khoá học</h3><button class="lm-btn-primary" @click="openCreate">+ Tạo khoá</button></div>\
  <table class="lm-table"><thead><tr><th>Tên</th><th>Cấp độ</th><th>Giá</th><th>Bài học</th><th>Ghi danh</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="c in courses" :key="c.id"><td><strong>{{ c.title }}</strong></td>\
    <td>{{ c.level }}</td><td>{{ fmtMoney(c.price) }}</td><td>{{ c.lessons_count || c.lesson_count || 0 }}</td><td>{{ c.enrollments_count || c.enrollment_count || 0 }}</td>\
    <td><span :class="c.is_published ? \'lm-badge-on\' : \'lm-badge-off\'">{{ c.is_published ? "✅ Xuất bản" : "📝 Nháp" }}</span></td>\
    <td><button class="lm-btn-primary" @click="$emit(\'selectCourse\', c)">📖 Chi tiết</button> <button @click="openEdit(c)">✏️</button> <button class="lm-btn-del" @click="remove(c.id)">🗑</button></td></tr></tbody></table>\
  <div v-if="showModal" class="lm-modal-overlay" @click.self="showModal=false"><div class="lm-modal"><h4>{{ editing ? "Sửa" : "Tạo" }} khoá học</h4>\
    <label>Tên <input v-model="form.title" class="lm-input" /></label>\
    <label>Mô tả <textarea v-model="form.description" class="lm-input lm-textarea"></textarea></label>\
    <div class="lm-form-row"><label>Giá <input v-model.number="form.price" type="number" class="lm-input" /></label>\
      <label>Cấp độ <select v-model="form.level" class="lm-input"><option value="beginner">Cơ bản</option><option value="intermediate">Trung cấp</option><option value="advanced">Nâng cao</option></select></label></div>\
    <label>Giảng viên <input v-model="form.instructor_name" class="lm-input" /></label>\
    <label class="lm-check"><input type="checkbox" v-model="form.is_published" /> Xuất bản</label>\
    <label class="lm-check"><input type="checkbox" v-model="form.certificate_enabled" /> Cấp chứng chỉ</label>\
    <div class="lm-modal-actions"><button class="lm-btn-primary" @click="save">💾</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var LmsLessons = { name: 'LmsLessons', props: { courseId: [String,Number] }, setup: function(props) {
    var lessons = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/lms/courses/' + props.courseId + '/lessons'); lessons.value = (await r.json()).data || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { title:'', content:'', video_url:'', duration_minutes:0, is_free:false, is_locked:false, sort_order:lessons.value.length }; showModal.value = true; }
    function openEdit(l) { editing.value = l.id; form.value = Object.assign({}, l); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST';
      var u = editing.value ? '/lms/courses/' + props.courseId + '/lessons/' + editing.value : '/lms/courses/' + props.courseId + '/lessons';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/lms/courses/' + props.courseId + '/lessons/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { lessons, loading, showModal, form, editing, openCreate, openEdit, save, remove };
  }, template: '\
<div class="lm-section"><div class="lm-header"><h3>📖 Bài học</h3><button class="lm-btn-primary" @click="openCreate">+ Thêm bài</button></div>\
  <table class="lm-table"><thead><tr><th>#</th><th>Tên</th><th>Video</th><th>Thời lượng</th><th>Miễn phí</th><th>Khoá</th><th></th></tr></thead>\
  <tbody><tr v-for="(l, idx) in lessons" :key="l.id"><td>{{ idx + 1 }}</td><td>{{ l.title }}</td>\
    <td>{{ l.video_url ? "🎥" : "-" }}</td><td>{{ l.duration_minutes || 0 }} phút</td>\
    <td>{{ l.is_free ? "✅" : "❌" }}</td><td>{{ l.is_locked ? "🔒" : "🔓" }}</td>\
    <td><button @click="openEdit(l)">✏️</button><button class="lm-btn-del" @click="remove(l.id)">🗑</button></td></tr></tbody></table>\
  <div v-if="showModal" class="lm-modal-overlay" @click.self="showModal=false"><div class="lm-modal"><h4>{{ editing ? "Sửa" : "Thêm" }} bài học</h4>\
    <label>Tiêu đề <input v-model="form.title" class="lm-input" /></label>\
    <label>Nội dung <textarea v-model="form.content" class="lm-input lm-textarea" rows="5"></textarea></label>\
    <label>Video URL <input v-model="form.video_url" class="lm-input" /></label>\
    <div class="lm-form-row"><label>Thời lượng (phút) <input v-model.number="form.duration_minutes" type="number" class="lm-input" /></label>\
      <label>Thứ tự <input v-model.number="form.sort_order" type="number" class="lm-input" /></label></div>\
    <label class="lm-check"><input type="checkbox" v-model="form.is_free" /> Miễn phí</label>\
    <label class="lm-check"><input type="checkbox" v-model="form.is_locked" /> Khoá bài</label>\
    <div class="lm-modal-actions"><button class="lm-btn-primary" @click="save">💾</button><button @click="showModal=false">Huỷ</button></div></div></div>\
</div>' };

  var LmsManager = { name: 'LmsManager',
    components: { LmsStats:LmsStats, LmsCourses:LmsCourses, LmsLessons:LmsLessons },
    setup: function() { var tab = e.ref('stats'); var selectedCourse = e.ref(null);
      function selectCourse(c) { selectedCourse.value = c; tab.value = 'lessons'; }
      function backToCourses() { selectedCourse.value = null; tab.value = 'courses'; }
      return { tab, selectedCourse, selectCourse, backToCourses }; },
    template: '<div class="lms-plugin"><div class="lm-tabs">\
      <button :class="{\'lm-tab-active\':tab===\'stats\'}" @click="tab=\'stats\'">📊 Tổng quan</button>\
      <button :class="{\'lm-tab-active\':tab===\'courses\'}" @click="tab=\'courses\'">📚 Khoá học</button>\
      <button v-if="selectedCourse" :class="{\'lm-tab-active\':tab===\'lessons\'}" @click="tab=\'lessons\'">📖 {{ selectedCourse.title }}</button></div>\
      <LmsStats v-if="tab===\'stats\'" /><LmsCourses v-else-if="tab===\'courses\'" @selectCourse="selectCourse" />\
      <div v-else-if="tab===\'lessons\' && selectedCourse"><button class="lm-btn-back" @click="backToCourses">← Quay lại</button>\
      <LmsLessons :courseId="selectedCourse.id" /></div></div>' };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) { items.push({key:'lms/dashboard',label:'LMS',icon:'GraduationCap',featureGroup:'store',moduleId:'lms'}); return items; });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'lms/dashboard':'lms'}); return c; });
  }
  var plugin = { id:'lms', name:'Quản lý Học trực tuyến', version:'2.0.0',
    components: {'lms': e.markRaw(LmsManager) },
    sidebar: {group:'Học tập', items:[{key:'lms-dashboard',label:'LMS',icon:'GraduationCap',route:'lms/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['lms'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'lms', plugin: plugin } }));
  return plugin;
})(Vue);
