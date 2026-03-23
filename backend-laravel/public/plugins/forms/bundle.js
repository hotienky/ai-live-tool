/**
 * Forms Plugin — Full Form Builder + Submissions Viewer
 * WordPress-style drag & drop form builder
 */
var Plugin_forms = (function(e, k) {
  'use strict';

  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var t = (bridge && bridge.t) || function(k, d) { return d; };
  var showToast = (bridge && bridge.showToast) || function() {};

  // ── Field Types ──
  var FIELD_TYPES = [
    { type: 'text',     label: 'Text',     icon: '' },
    { type: 'email',    label: 'Email',    icon: '' },
    { type: 'phone',    label: 'Phone',    icon: '' },
    { type: 'number',   label: 'Number',   icon: '' },
    { type: 'textarea', label: 'Textarea', icon: '' },
    { type: 'select',   label: 'Dropdown', icon: '' },
    { type: 'checkbox', label: 'Checkbox', icon: '' },
    { type: 'radio',    label: 'Radio',    icon: '⭕' },
    { type: 'date',     label: 'Date',     icon: '' },
    { type: 'file',     label: 'File',     icon: '' },
    { type: 'heading',  label: 'Heading',  icon: '' },
    { type: 'divider',  label: 'Divider',  icon: '' },
  ];

  // ══════════════════════════════════════
  // Form Builder Component
  // ══════════════════════════════════════
  var FormBuilder = {
    name: 'FormBuilder',
    emits: ['navigate', 'back'],
    props: { formId: { type: [String, Number], default: null } },
    setup: function(props, ctx) {
      var form = e.ref({ title: '', fields: [], settings: { success_message: 'Cảm ơn bạn đã gửi!', email_to: '' }, is_active: true });
      var saving = e.ref(false);
      var dragIdx = e.ref(-1);

      e.onMounted(function() {
        if (props.formId) loadForm();
      });

      async function loadForm() {
        try {
          var res = await apiFetch('/forms/' + props.formId);
          var data = await res.json();
          form.value = data;
        } catch(err) { showToast('Lỗi tải form: ' + err.message, 'error'); }
      }

      function addField(type) {
        form.value.fields.push({
          id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          type: type,
          label: FIELD_TYPES.find(function(f) { return f.type === type; }).label,
          placeholder: '',
          required: false,
          options: (type === 'select' || type === 'radio') ? ['Option 1', 'Option 2'] : [],
          width: 'full', // full, half
        });
      }
      function removeField(idx) { form.value.fields.splice(idx, 1); }

      function moveField(from, to) {
        if (to < 0 || to >= form.value.fields.length) return;
        var fields = form.value.fields;
        var item = fields.splice(from, 1)[0];
        fields.splice(to, 0, item);
      }

      async function saveForm() {
        if (!form.value.title) { showToast('Vui lòng nhập tên form', 'error'); return; }
        if (!form.value.fields.length) { showToast('Form cần ít nhất 1 trường', 'error'); return; }
        saving.value = true;
        try {
          var method = props.formId ? 'PUT' : 'POST';
          var url = props.formId ? '/forms/' + props.formId : '/forms';
          var res = await apiFetch(url, { method: method, body: JSON.stringify(form.value) });
          await res.json();
          showToast(props.formId ? 'Đã cập nhật form' : 'Đã tạo form', 'success');
          ctx.emit('back');
        } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
        saving.value = false;
      }

      return { form, saving, dragIdx, FIELD_TYPES, addField, removeField, moveField, saveForm };
    },
    template: '\
<div class="fb">\
  <div class="fb-header">\
    <button class="fb-back" @click="$emit(\'back\')">← Quay lại</button>\
    <h3>{{ formId ? "Sửa Form" : "Tạo Form mới" }}</h3>\
    <button class="fb-save" :disabled="saving" @click="saveForm">{{ saving ? "Đang lưu..." : "Lưu" }}</button>\
  </div>\
  <div class="fb-body">\
    <div class="fb-sidebar">\
      <h4>Thêm trường</h4>\
      <div class="fb-field-types">\
        <button v-for="ft in FIELD_TYPES" :key="ft.type" class="fb-ft-btn" @click="addField(ft.type)">\
          <span class="fb-ft-icon">{{ ft.icon }}</span>\
          <span>{{ ft.label }}</span>\
        </button>\
      </div>\
      <div class="fb-settings">\
        <h4>Cài đặt</h4>\
        <label>Tên form</label>\
        <input v-model="form.title" class="fb-input" placeholder="Liên hệ, Đăng ký..." />\
        <label>Thông báo sau gửi</label>\
        <input v-model="form.settings.success_message" class="fb-input" />\
        <label>Email nhận</label>\
        <input v-model="form.settings.email_to" class="fb-input" type="email" placeholder="admin@example.com" />\
        <label class="fb-check"><input type="checkbox" v-model="form.is_active" /> Kích hoạt</label>\
      </div>\
    </div>\
    <div class="fb-canvas">\
      <div v-if="!form.fields.length" class="fb-empty">Kéo thả hoặc click để thêm trường vào form</div>\
      <div v-for="(field, idx) in form.fields" :key="field.id" class="fb-field" :class="{\'fb-field--half\': field.width===\'half\'}">\
        <div class="fb-field-header">\
          <span class="fb-field-drag">⋮⋮</span>\
          <span class="fb-field-type">{{ FIELD_TYPES.find(f => f.type === field.type)?.icon }} {{ field.type }}</span>\
          <div class="fb-field-actions">\
            <button @click="moveField(idx, idx-1)" :disabled="idx===0" title="Lên">↑</button>\
            <button @click="moveField(idx, idx+1)" :disabled="idx===form.fields.length-1" title="Xuống">↓</button>\
            <button class="fb-field-w" @click="field.width = field.width===\'full\' ? \'half\' : \'full\'" :title="field.width===\'full\' ? \'Thu nhỏ\' : \'Mở rộng\'">{{ field.width === "full" ? "▬" : "▫" }}</button>\
            <button class="fb-field-del" @click="removeField(idx)"></button>\
          </div>\
        </div>\
        <div class="fb-field-body">\
          <div class="fb-field-row">\
            <label>Label</label>\
            <input v-model="field.label" class="fb-input" />\
          </div>\
          <div class="fb-field-row" v-if="field.type !== \'heading\' && field.type !== \'divider\'">\
            <label>Placeholder</label>\
            <input v-model="field.placeholder" class="fb-input" />\
          </div>\
          <div class="fb-field-row" v-if="field.type === \'select\' || field.type === \'radio\' || field.type === \'checkbox\'">\
            <label>Options (1 dòng/option)</label>\
            <textarea v-model="field.options" class="fb-input fb-textarea" @input="field.options = $event.target.value.split(\'\\n\')">{{ Array.isArray(field.options) ? field.options.join("\\n") : field.options }}</textarea>\
          </div>\
          <label class="fb-check" v-if="field.type !== \'heading\' && field.type !== \'divider\'">\
            <input type="checkbox" v-model="field.required" /> Bắt buộc\
          </label>\
        </div>\
      </div>\
    </div>\
  </div>\
</div>'
  };

  // ══════════════════════════════════════
  // Form List Component
  // ══════════════════════════════════════
  var FormList = {
    name: 'FormList',
    emits: ['navigate'],
    setup: function(_, ctx) {
      var forms = e.ref([]);
      var loading = e.ref(true);

      e.onMounted(loadForms);

      async function loadForms() {
        loading.value = true;
        try {
          var res = await apiFetch('/forms');
          forms.value = await res.json();
        } catch(err) { forms.value = []; }
        loading.value = false;
      }

      async function deleteForm(id) {
        if (!confirm('Xóa form này?')) return;
        try {
          await apiFetch('/forms/' + id, { method: 'DELETE' });
          showToast('Đã xóa', 'success');
          loadForms();
        } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
      }

      async function toggleActive(form) {
        try {
          await apiFetch('/forms/' + form.id, { method: 'PUT', body: JSON.stringify({ is_active: !form.is_active }) });
          form.is_active = !form.is_active;
        } catch(err) { showToast('Lỗi', 'error'); }
      }

      function copyEmbed(form) {
        var code = '<iframe src="/form/' + form.slug + '" width="100%" height="500" frameborder="0"></iframe>';
        navigator.clipboard.writeText(code);
        showToast('Đã copy mã nhúng', 'success');
      }

      return { forms, loading, deleteForm, toggleActive, copyEmbed };
    },
    template: '\
<div class="fl">\
  <div class="fl-header">\
    <h3>Form Builder</h3>\
    <button class="fl-create" @click="$emit(\'navigate\', \'forms/create\')">+ Tạo Form</button>\
  </div>\
  <div v-if="loading" class="fl-loading">Đang tải...</div>\
  <div v-else-if="!forms.length" class="fl-empty">\
    <div class="fl-empty-icon"></div>\
    <p>Chưa có form nào. Tạo form đầu tiên!</p>\
    <button class="fl-create" @click="$emit(\'navigate\', \'forms/create\')">+ Tạo Form</button>\
  </div>\
  <div v-else class="fl-grid">\
    <div v-for="form in forms" :key="form.id" class="fl-card">\
      <div class="fl-card-header">\
        <h4>{{ form.title }}</h4>\
        <span class="fl-badge" :class="form.is_active ? \'fl-badge--active\' : \'fl-badge--inactive\'">{{ form.is_active ? "Active" : "Draft" }}</span>\
      </div>\
      <div class="fl-card-meta">\
        <span> {{ (form.fields || []).length }} trường</span>\
        <span> {{ form.submission_count || form.submissions_count || 0 }} lượt gửi</span>\
      </div>\
      <div class="fl-card-slug">Slug: <code>{{ form.slug }}</code></div>\
      <div class="fl-card-actions">\
        <button @click="$emit(\'navigate\', \'forms/edit/\' + form.id)"> Sửa</button>\
        <button @click="$emit(\'navigate\', \'forms/submissions/\' + form.id)"> Xem gửi</button>\
        <button @click="copyEmbed(form)"> Embed</button>\
        <button @click="toggleActive(form)">{{ form.is_active ? "⏸ Tắt" : "▶ Bật" }}</button>\
        <button class="fl-del" @click="deleteForm(form.id)"></button>\
      </div>\
    </div>\
  </div>\
</div>'
  };

  // ══════════════════════════════════════
  // Submissions Viewer Component
  // ══════════════════════════════════════
  var SubmissionViewer = {
    name: 'SubmissionViewer',
    emits: ['back'],
    props: { formId: { type: [String, Number], required: true } },
    setup: function(props) {
      var submissions = e.ref([]);
      var formTitle = e.ref('');
      var formFields = e.ref([]);
      var loading = e.ref(true);

      e.onMounted(loadData);

      async function loadData() {
        loading.value = true;
        try {
          var fRes = await apiFetch('/forms/' + props.formId);
          var form = await fRes.json();
          formTitle.value = form.title;
          formFields.value = form.fields || [];

          var sRes = await apiFetch('/forms/' + props.formId + '/submissions');
          var data = await sRes.json();
          submissions.value = data.data || data || [];
        } catch(err) { console.error(err); }
        loading.value = false;
      }

      async function deleteSubmission(id) {
        if (!confirm('Xóa mục này?')) return;
        try {
          await apiFetch('/form-submissions/' + id, { method: 'DELETE' });
          submissions.value = submissions.value.filter(function(s) { return s.id !== id; });
          showToast('Đã xóa', 'success');
        } catch(err) { showToast('Lỗi', 'error'); }
      }

      function formatDate(d) {
        if (!d) return '-';
        return new Date(d).toLocaleString('vi-VN');
      }

      return { submissions, formTitle, formFields, loading, deleteSubmission, formatDate };
    },
    template: '\
<div class="sv">\
  <div class="sv-header">\
    <button class="sv-back" @click="$emit(\'back\')">← Quay lại</button>\
    <h3> {{ formTitle }} — Dữ liệu gửi ({{ submissions.length }})</h3>\
  </div>\
  <div v-if="loading" class="sv-loading">Đang tải...</div>\
  <div v-else-if="!submissions.length" class="sv-empty">Chưa có ai gửi form này</div>\
  <table v-else class="sv-table">\
    <thead>\
      <tr>\
        <th>#</th>\
        <th v-for="f in formFields" :key="f.id">{{ f.label }}</th>\
        <th>Thời gian</th>\
        <th>IP</th>\
        <th></th>\
      </tr>\
    </thead>\
    <tbody>\
      <tr v-for="(sub, idx) in submissions" :key="sub.id" :class="{\'sv-unread\': !sub.is_read}">\
        <td>{{ idx + 1 }}</td>\
        <td v-for="f in formFields" :key="f.id">{{ sub.data && sub.data[f.id] || sub.data && sub.data[f.label] || \'-\' }}</td>\
        <td>{{ formatDate(sub.created_at) }}</td>\
        <td><small>{{ sub.ip_address || \'-\' }}</small></td>\
        <td><button class="sv-del" @click="deleteSubmission(sub.id)"></button></td>\
      </tr>\
    </tbody>\
  </table>\
</div>'
  };

  // ══════════════════════════════════════
  // Main Manager Component (routes internally)
  // ══════════════════════════════════════
  var FormsManager = {
    name: 'FormsManager',
    emits: ['navigate'],
    components: { FormList: FormList, FormBuilder: FormBuilder, SubmissionViewer: SubmissionViewer },
    setup: function(_, ctx) {
      var view = e.ref('list'); // list, create, edit, submissions
      var editId = e.ref(null);
      var subsFormId = e.ref(null);

      function onNavigate(route) {
        if (route === 'forms/create') {
          view.value = 'create'; editId.value = null;
        } else if (route.startsWith('forms/edit/')) {
          view.value = 'edit'; editId.value = route.replace('forms/edit/', '');
        } else if (route.startsWith('forms/submissions/')) {
          view.value = 'submissions'; subsFormId.value = route.replace('forms/submissions/', '');
        } else {
          ctx.emit('navigate', route);
        }
      }

      function goBack() { view.value = 'list'; editId.value = null; subsFormId.value = null; }

      return { view, editId, subsFormId, onNavigate, goBack };
    },
    template: '\
<div class="forms-plugin">\
  <FormList v-if="view === \'list\'" @navigate="onNavigate" />\
  <FormBuilder v-else-if="view === \'create\'" @back="goBack" />\
  <FormBuilder v-else-if="view === \'edit\'" :formId="editId" @back="goBack" />\
  <SubmissionViewer v-else-if="view === \'submissions\'" :formId="subsFormId" @back="goBack" />\
</div>'
  };

  // ── Register with hooks ──
  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) {
      items.push(
        { key: 'forms', label: t('forms.builder', 'Form Builder'), icon: 'FormInput', featureGroup: 'store', moduleId: 'forms' },
        { key: 'forms/submissions', label: t('forms.submissions', 'Dữ liệu gửi'), icon: 'Inbox', featureGroup: 'store', moduleId: 'forms' }
      );
      return items;
    });
    hooks.addFilter('admin_routes', function(config) {
      Object.assign(config.routeToTab, {
        'forms': 'forms',
        'forms/create': 'forms',
        'forms/submissions': 'form-submissions',
      });
      return config;
    });
  }

  // ── Register Plugin ──
  var plugin = {
    id: 'forms',
    name: 'Form Builder',
    version: '1.0.0',
    components: {
      'forms': e.markRaw(FormsManager),
      'form-submissions': e.markRaw(SubmissionViewer),
    },
    sidebar: {
      group: 'Nội dung',
      items: [
        { key: 'forms', label: 'Form Builder', icon: 'FormInput', route: 'forms' },
        { key: 'forms-submissions', label: 'Dữ liệu gửi', icon: 'Inbox', route: 'forms/submissions' },
      ]
    }
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['forms'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'forms', plugin: plugin } }));
  return plugin;
})(Vue, LucideVueNext);
