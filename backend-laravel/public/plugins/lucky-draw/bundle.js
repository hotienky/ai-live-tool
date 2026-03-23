/**
 * Lucky Draw Plugin — Full Admin UI
 * Campaigns, Prizes, Participants, Draw Execution, Stats
 */
var Plugin_luckydraw = (function(e) {
  'use strict';
  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var showToast = (bridge && bridge.showToast) || function() {};
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '-'; }

  var LDStats = { name: 'LDStats', setup: function() {
    var stats = e.ref(null); var loading = e.ref(true);
    e.onMounted(async function() { try { var r = await apiFetch('/lucky-draw/stats'); var d = await r.json(); stats.value = d.data || d; } catch(e) {} loading.value = false; });
    return { stats, loading };
  }, template: '<div class="ld-stats"><div v-if="loading" class="ld-loading">Đang tải...</div><div v-else-if="stats" class="ld-stats-grid">\
    <div class="ld-stat-card"><div class="ld-stat-num">{{ stats.totalCampaigns }}</div><div class="ld-stat-label">Chiến dịch</div></div>\
    <div class="ld-stat-card"><div class="ld-stat-num">{{ stats.activeCampaigns }}</div><div class="ld-stat-label">Đang chạy</div></div>\
    <div class="ld-stat-card"><div class="ld-stat-num">{{ stats.totalParticipants }}</div><div class="ld-stat-label">Người tham gia</div></div>\
    <div class="ld-stat-card"><div class="ld-stat-num">{{ stats.totalWinners }}</div><div class="ld-stat-label">Người thắng</div></div>\
  </div></div>' };

  var LDCampaigns = { name: 'LDCampaigns', emits: ['select'], setup: function(_, ctx) {
    var items = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/lucky-draw/campaigns'); var d = await r.json(); items.value = d.data || d || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { name:'', description:'', start_date:'', end_date:'', max_participants:null, is_active:true, rules:{} }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST'; var u = editing.value ? '/lucky-draw/campaigns/' + editing.value : '/lucky-draw/campaigns';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/lucky-draw/campaigns/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { items, loading, showModal, form, editing, openCreate, openEdit, save, remove, fmtDate };
  }, template: '\
<div class="ld-section"><div class="ld-header"><h3>Chiến dịch</h3><button class="btn-primary btn-sm" @click="openCreate">+ Tạo chiến dịch</button></div>\
  <table class="ld-table"><thead><tr><th>Tên</th><th>Bắt đầu</th><th>Kết thúc</th><th>Người tham gia</th><th>Giải thưởng</th><th>TT</th><th></th></tr></thead>\
  <tbody><tr v-for="c in items" :key="c.id"><td><strong>{{ c.name }}</strong></td><td>{{ fmtDate(c.start_date) }}</td><td>{{ fmtDate(c.end_date) }}</td>\
    <td>{{ c.participants_count || 0 }}{{ c.max_participants ? "/" + c.max_participants : "" }}</td>\
    <td>{{ c.prizes_count || 0 }}</td>\
    <td><span :class="c.is_active ? \'ld-badge-on\' : \'ld-badge-off\'">{{ c.is_active ? "Đang chạy" : "Tắt" }}</span></td>\
    <td style="display:flex; gap:6px; justify-content:flex-end;"><button class="btn-primary btn-sm" @click="$emit(\'select\', c)">Quản lý</button> <button class="btn-ghost btn-sm" style="color:var(--plugin-blue)" @click="openEdit(c)">Sửa</button> <button class="btn-ghost btn-sm" style="color:var(--plugin-red)" @click="remove(c.id)">Xoá</button></td></tr></tbody></table>\
  <div v-if="showModal" class="modal-overlay" @click.self="showModal=false"><div class="modal"><h4>{{ editing ? "Sửa" : "Tạo" }} chiến dịch</h4>\
    <div class="form-group"><label>Tên <input v-model="form.name" class="ld-input" /></label></div>\
    <div class="form-group"><label>Mô tả <textarea v-model="form.description" class="ld-input ld-textarea"></textarea></label></div>\
    <div class="form-row"><div class="form-group"><label>Bắt đầu <input v-model="form.start_date" type="date" class="ld-input" /></label></div>\
      <div class="form-group"><label>Kết thúc <input v-model="form.end_date" type="date" class="ld-input" /></label></div></div>\
    <div class="form-group"><label>Giới hạn người <input v-model.number="form.max_participants" type="number" class="ld-input" placeholder="Không giới hạn" /></label></div>\
    <div class="ld-check"><label><input type="checkbox" v-model="form.is_active" /> Kích hoạt</label></div>\
    <div class="modal-actions"><button class="btn-cancel" @click="showModal=false">Huỷ</button><button class="btn-save" @click="save">Lưu</button></div></div></div>\
</div>' };

  var LDPrizes = { name: 'LDPrizes', props: { campaignId: [String,Number] }, setup: function(props) {
    var prizes = e.ref([]); var loading = e.ref(true); var showModal = e.ref(false); var form = e.ref({}); var editing = e.ref(null);
    e.onMounted(load);
    async function load() { loading.value = true; try { var r = await apiFetch('/lucky-draw/campaigns/' + props.campaignId + '/prizes'); var d = await r.json(); prizes.value = d.data || d || []; } catch(e) {} loading.value = false; }
    function openCreate() { editing.value = null; form.value = { name:'', description:'', quantity:1, probability:null, value:0 }; showModal.value = true; }
    function openEdit(i) { editing.value = i.id; form.value = Object.assign({}, i); showModal.value = true; }
    async function save() { try { var m = editing.value ? 'PUT' : 'POST';
      var u = editing.value ? '/lucky-draw/campaigns/' + props.campaignId + '/prizes/' + editing.value : '/lucky-draw/campaigns/' + props.campaignId + '/prizes';
      await apiFetch(u, { method:m, body:JSON.stringify(form.value) }); showToast('Đã lưu','success'); showModal.value = false; load(); } catch(e) { showToast('Lỗi','error'); } }
    async function remove(id) { if (!confirm('Xoá?')) return; try { await apiFetch('/lucky-draw/campaigns/' + props.campaignId + '/prizes/' + id, { method:'DELETE' }); load(); } catch(e) {} }
    return { prizes, loading, showModal, form, editing, openCreate, openEdit, save, remove };
  }, template: '\
<div class="ld-section"><div class="ld-header"><h3>Giải thưởng</h3><button class="btn-primary btn-sm" @click="openCreate">+ Thêm giải thưởng</button></div>\
  <table class="ld-table"><thead><tr><th>Tên giải</th><th>Mô tả</th><th>Số lượng</th><th>Xác suất</th><th>Đã trúng</th><th></th></tr></thead>\
  <tbody><tr v-for="p in prizes" :key="p.id"><td><strong>{{ p.name }}</strong></td><td>{{ p.description || "-" }}</td>\
    <td>{{ p.quantity }}</td><td>{{ p.probability ? (p.probability * 100).toFixed(1) + "%" : "Auto" }}</td><td>{{ p.winners_count || 0 }}</td>\
    <td style="display:flex; gap:6px; justify-content:flex-end;"><button class="btn-ghost btn-sm" style="color:var(--plugin-blue)" @click="openEdit(p)">Sửa</button><button class="btn-ghost btn-sm" style="color:var(--plugin-red)" @click="remove(p.id)">Xoá</button></td></tr></tbody></table>\
  <div v-if="showModal" class="modal-overlay" @click.self="showModal=false"><div class="modal"><h4>{{ editing ? "Sửa" : "Thêm" }} giải</h4>\
    <div class="form-group"><label>Tên <input v-model="form.name" class="ld-input" /></label></div>\
    <div class="form-group"><label>Mô tả <textarea v-model="form.description" class="ld-input ld-textarea"></textarea></label></div>\
    <div class="form-row"><div class="form-group"><label>Số lượng <input v-model.number="form.quantity" type="number" class="ld-input" /></label></div>\
      <div class="form-group"><label>Xác suất (0-1) <input v-model.number="form.probability" type="number" step="0.01" class="ld-input" placeholder="Tự động" /></label></div></div>\
    <div class="modal-actions"><button class="btn-cancel" @click="showModal=false">Huỷ</button><button class="btn-save" @click="save">Lưu</button></div></div></div>\
</div>' };

  var LDDraw = { name: 'LDDraw', props: { campaignId: [String,Number] }, setup: function(props) {
    var drawing = e.ref(false); var result = e.ref(null);
    async function executeDraw() { drawing.value = true; result.value = null;
      try { var r = await apiFetch('/lucky-draw/campaigns/' + props.campaignId + '/draw', { method:'POST' }); var d = await r.json(); result.value = d.data || d; showToast('Đã quay số!','success'); }
      catch(e) { showToast('Lỗi: ' + e.message,'error'); } drawing.value = false; }
    return { drawing, result, executeDraw };
  }, template: '\
<div class="ld-draw"><h3> Quay thưởng</h3>\
  <button class="btn-primary" style="padding: 14px 32px; font-size: 16px; border-radius: 50px;" @click="executeDraw" :disabled="drawing">\
    <span v-if="drawing">Đang quay...</span><span v-else>BẮT ĐẦU QUAY</span></button>\
  <div v-if="result" class="ld-result"><h4> Kết quả</h4>\
    <div class="ld-winner-card"><div class="ld-winner-name">{{ result.winner_name || "N/A" }}</div>\
      <div class="ld-winner-prize">Giải: {{ result.prize_name || "N/A" }}</div></div></div>\
</div>' };

  var LDTheme = { name: 'LDTheme', props: { campaignId: [String,Number] }, setup: function(props) {
    var form = e.ref({ background_image: '', settings: { wheel_color: '#E84C3D', text_color: '#FFFFFF', button_text: 'QUAY NGAY' } });
    var loading = e.ref(true); var saving = e.ref(false);
    e.onMounted(async function() {
      loading.value = true;
      try {
        var r = await apiFetch('/lucky-draw/campaigns/' + props.campaignId); var d = await r.json(); var data = d.data || d;
        form.value = { background_image: data.background_image || '', settings: Object.assign({ wheel_color: '#E84C3D', text_color: '#FFFFFF', button_text: 'QUAY NGAY' }, data.settings || {}) };
      } catch(ex) {} loading.value = false;
    });
    async function save() {
      saving.value = true;
      try { await apiFetch('/lucky-draw/campaigns/' + props.campaignId, { method:'PUT', body:JSON.stringify(form.value) }); showToast('Đã lưu giao diện','success'); } catch(ex) { showToast('Lỗi lưu giao diện','error'); }
      saving.value = false;
    }
    return { form, loading, saving, save };
  }, template: '\
<div class="ld-section" style="max-width:600px">\
  <div v-if="loading">Đang tải...</div>\
  <div v-else>\
    <div class="form-group"><label>Hình nền (URL) <input v-model="form.background_image" class="ld-input" placeholder="https://..." /></label></div>\
    <div class="form-row">\
      <div class="form-group"><label>Màu vòng quay <input v-model="form.settings.wheel_color" type="color" class="ld-input" style="padding:0; height:40px; border:none; background:transparent" /></label></div>\
      <div class="form-group"><label>Màu chữ vòng quay <input v-model="form.settings.text_color" type="color" class="ld-input" style="padding:0; height:40px; border:none; background:transparent" /></label></div>\
    </div>\
    <div class="form-group"><label>Nút Quay (Text) <input v-model="form.settings.button_text" class="ld-input" /></label></div>\
    <button class="btn-save" style="margin-top:20px" @click="save" :disabled="saving">{{ saving ? "Đang lưu..." : "Lưu Giao Diện" }}</button>\
  </div>\
</div>' };

  var LDManager = { name: 'LDManager',
    components: { LDStats:LDStats, LDCampaigns:LDCampaigns, LDPrizes:LDPrizes, LDDraw:LDDraw, LDTheme:LDTheme },
    setup: function() { var tab = e.ref('stats'); var selectedCampaign = e.ref(null);
      function selectCampaign(c) { selectedCampaign.value = c; tab.value = 'prizes'; }
      function back() { selectedCampaign.value = null; tab.value = 'campaigns'; }
      return { tab, selectedCampaign, selectCampaign, back }; },
    template: '<div class="luckydraw-plugin"><div class="ld-tabs">\
      <button :class="tab===\'stats\' ? \'btn-primary\' : \'btn-ghost\'" @click="tab=\'stats\'">Tổng quan</button>\
      <button :class="tab===\'campaigns\' ? \'btn-primary\' : \'btn-ghost\'" @click="tab=\'campaigns\'">Chiến dịch</button>\
      <button v-if="selectedCampaign" :class="tab===\'prizes\' ? \'btn-primary\' : \'btn-ghost\'" @click="tab=\'prizes\'">Giải</button>\
      <button v-if="selectedCampaign" :class="tab===\'theme\' ? \'btn-primary\' : \'btn-ghost\'" @click="tab=\'theme\'">Giao diện</button>\
      <button v-if="selectedCampaign" :class="tab===\'draw\' ? \'btn-primary\' : \'btn-ghost\'" @click="tab=\'draw\'">Quay</button></div>\
      <LDStats v-if="tab===\'stats\'" />\
      <LDCampaigns v-else-if="tab===\'campaigns\'" @select="selectCampaign" />\
      <div v-else-if="tab===\'prizes\' && selectedCampaign"><button class="btn-ghost btn-sm" style="margin-bottom:15px" @click="back">← Quay lại</button><h3>Giải thưởng - {{ selectedCampaign.name }}</h3>\
        <LDPrizes :campaignId="selectedCampaign.id" /></div>\
      <div v-else-if="tab===\'theme\' && selectedCampaign"><button class="btn-ghost btn-sm" style="margin-bottom:15px" @click="back">← Quay lại</button><h3>Giao diện UI - {{ selectedCampaign.name }}</h3>\
        <LDTheme :campaignId="selectedCampaign.id" /></div>\
      <div v-else-if="tab===\'draw\' && selectedCampaign"><button class="btn-ghost btn-sm" style="margin-bottom:15px" @click="back">← Quay lại</button><h3>Test Quay Thử - {{ selectedCampaign.name }}</h3>\
        <LDDraw :campaignId="selectedCampaign.id" /></div></div>' };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) { items.push({key:'lucky-draw/dashboard',label:'Quay thưởng',icon:'Dice5',featureGroup:'store',moduleId:'lucky-draw'}); return items; });
    hooks.addFilter('admin_routes', function(c) { Object.assign(c.routeToTab, {'lucky-draw/dashboard':'lucky-draw'}); return c; });
  }
  var plugin = { id:'lucky-draw', name:'Quản lý Quay thưởng', version:'2.0.0',
    components: {'lucky-draw': e.markRaw(LDManager) },
    sidebar: {group:'Sự kiện', items:[{key:'lucky-draw-dashboard',label:'Quay thưởng',icon:'Dice5',route:'lucky-draw/dashboard'}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['lucky-draw'] = plugin;
  window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: 'lucky-draw', plugin: plugin } }));
  return plugin;
})(Vue);
