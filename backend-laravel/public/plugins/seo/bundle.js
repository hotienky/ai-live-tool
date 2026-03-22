/**
 * SEO Plugin — Meta, Sitemap, Schema, Analysis
 */
var Plugin_seo = (function(e, k) {
  'use strict';

  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var t = (bridge && bridge.t) || function(k, d) { return d; };
  var showToast = (bridge && bridge.showToast) || function() {};

  var SeoManager = {
    name: 'SeoManager',
    setup: function() {
      var activeTab = e.ref('meta');
      var saving = e.ref(false);
      var meta = e.ref({
        site_title: '', site_description: '',
        og_image: '', google_verification: '',
        robots_txt: "User-agent: *\nAllow: /\nSitemap: /sitemap.xml",
      });

      e.onMounted(loadSeo);

      async function loadSeo() {
        try {
          var res = await apiFetch('/system-config/group/seo');
          var data = await res.json();
          if (Array.isArray(data)) {
            data.forEach(function(r) {
              if (r.key && meta.value.hasOwnProperty(r.key.replace('seo.', ''))) {
                meta.value[r.key.replace('seo.', '')] = r.value || '';
              }
            });
          }
        } catch(err) {}
      }

      async function saveSeo() {
        saving.value = true;
        try {
          var items = Object.entries(meta.value).map(function(entry) {
            return { key: 'seo.' + entry[0], value: entry[1], group_name: 'seo' };
          });
          await apiFetch('/system-config/batch', { method: 'POST', body: JSON.stringify({ items: items }) });
          showToast('Đã lưu cấu hình SEO', 'success');
        } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
        saving.value = false;
      }

      function generateSitemap() {
        window.open('/sitemap.xml', '_blank');
      }

      return { activeTab, saving, meta, saveSeo, generateSitemap };
    },
    template: '\
<div class="seo">\
  <div class="seo-header">\
    <h3>🔍 SEO & Tối ưu tìm kiếm</h3>\
  </div>\
  <div class="seo-tabs">\
    <button :class="{\'seo-tab--active\': activeTab===\'meta\'}" @click="activeTab=\'meta\'">📝 Meta Tags</button>\
    <button :class="{\'seo-tab--active\': activeTab===\'sitemap\'}" @click="activeTab=\'sitemap\'">🗺 Sitemap</button>\
    <button :class="{\'seo-tab--active\': activeTab===\'robots\'}" @click="activeTab=\'robots\'">🤖 Robots.txt</button>\
    <button :class="{\'seo-tab--active\': activeTab===\'analysis\'}" @click="activeTab=\'analysis\'">📊 Phân tích</button>\
  </div>\
  <div v-if="activeTab===\'meta\'" class="seo-panel">\
    <div class="seo-group">\
      <label>Tiêu đề website</label>\
      <input v-model="meta.site_title" class="seo-input" placeholder="Tên website" />\
      <small>Hiển thị trên Google: <strong>{{ meta.site_title || "Tên website" }}</strong></small>\
    </div>\
    <div class="seo-group">\
      <label>Mô tả website</label>\
      <textarea v-model="meta.site_description" class="seo-input seo-textarea" placeholder="Mô tả ngắn gọn..." maxlength="160"></textarea>\
      <small>{{ (meta.site_description || "").length }}/160 ký tự</small>\
    </div>\
    <div class="seo-group">\
      <label>OG Image URL</label>\
      <input v-model="meta.og_image" class="seo-input" placeholder="https://..." />\
    </div>\
    <div class="seo-group">\
      <label>Google Search Console Verification</label>\
      <input v-model="meta.google_verification" class="seo-input" placeholder="google-site-verification=..." />\
    </div>\
    <div class="seo-preview">\
      <h4>Preview trên Google</h4>\
      <div class="seo-google-preview">\
        <div class="sgp-title">{{ meta.site_title || "Tên website" }}</div>\
        <div class="sgp-url">https://yoursite.com</div>\
        <div class="sgp-desc">{{ meta.site_description || "Mô tả sẽ hiển thị ở đây..." }}</div>\
      </div>\
    </div>\
    <button class="seo-save" :disabled="saving" @click="saveSeo">{{ saving ? "Đang lưu..." : "💾 Lưu cấu hình SEO" }}</button>\
  </div>\
  <div v-if="activeTab===\'sitemap\'" class="seo-panel">\
    <div class="seo-feature">\
      <h4>🗺 Sitemap XML</h4>\
      <p>Sitemap tự động tạo từ các trang sản phẩm, CMS, danh mục.</p>\
      <button class="seo-save" @click="generateSitemap">Xem Sitemap</button>\
    </div>\
  </div>\
  <div v-if="activeTab===\'robots\'" class="seo-panel">\
    <div class="seo-group">\
      <label>robots.txt</label>\
      <textarea v-model="meta.robots_txt" class="seo-input seo-textarea seo-code" rows="8"></textarea>\
    </div>\
    <button class="seo-save" :disabled="saving" @click="saveSeo">💾 Lưu</button>\
  </div>\
  <div v-if="activeTab===\'analysis\'" class="seo-panel">\
    <div class="seo-checklist">\
      <h4>📊 SEO Checklist</h4>\
      <div class="seo-check" :class="meta.site_title ? \'seo-check--pass\' : \'seo-check--fail\'">\
        <span>{{ meta.site_title ? "✅" : "❌" }}</span> Tiêu đề website\
      </div>\
      <div class="seo-check" :class="meta.site_description ? \'seo-check--pass\' : \'seo-check--fail\'">\
        <span>{{ meta.site_description ? "✅" : "❌" }}</span> Mô tả website\
      </div>\
      <div class="seo-check" :class="meta.og_image ? \'seo-check--pass\' : \'seo-check--fail\'">\
        <span>{{ meta.og_image ? "✅" : "❌" }}</span> OG Image\
      </div>\
      <div class="seo-check" :class="meta.google_verification ? \'seo-check--pass\' : \'seo-check--fail\'">\
        <span>{{ meta.google_verification ? "✅" : "❌" }}</span> Google Verification\
      </div>\
    </div>\
  </div>\
</div>'
  };

  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) {
      items.push({ key: 'system/seo', label: 'SEO', icon: 'Search', featureGroup: null, moduleId: 'seo' });
      return items;
    });
    hooks.addFilter('admin_routes', function(config) {
      Object.assign(config.routeToTab, { 'system/seo': 'seo' });
      return config;
    });
  }

  var plugin = {
    id: 'seo',
    name: 'SEO & Tối ưu tìm kiếm',
    version: '1.0.0',
    components: { 'seo': e.markRaw(SeoManager) },
    sidebar: { group: 'Hệ thống', items: [{ key: 'seo', label: 'SEO', icon: 'Search', route: 'system/seo' }] }
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['seo'] = plugin;
  return plugin;
})(Vue, LucideVueNext);
