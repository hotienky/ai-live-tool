/**
 * AI Assistant Plugin — Full AI Toolkit for Content & Sales
 * Translate, Product Desc, Blog, Sales Copy, SEO, Free-form
 */
var Plugin_ai = (function(e) {
  'use strict';

  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var t = (bridge && bridge.t) || function(k, d) { return d; };
  var showToast = (bridge && bridge.showToast) || function() {};

  // ── Shared: AI Request Helper ──
  async function aiGenerate(body) {
    var res = await apiFetch('/ai/generate', { method: 'POST', body: JSON.stringify(body) });
    var data = await res.json();
    if (data.success === false) throw new Error(data.message || 'AI error');
    return data.data || data;
  }

  // ══════════════════════════════════════
  // AI Assistant Manager (Main Component)
  // ══════════════════════════════════════
  var AiAssistant = {
    name: 'AiAssistant',
    setup: function() {
      var activeTab = e.ref('translate');
      var loading = e.ref(false);
      var result = e.ref('');
      var copied = e.ref(false);

      // ── Translate State ──
      var trContent = e.ref('');
      var trLang = e.ref('en');
      var trFrom = e.ref('auto');
      var LANGS = [
        { code: 'en', label: '🇬🇧 English' }, { code: 'vi', label: '🇻🇳 Tiếng Việt' },
        { code: 'ja', label: '🇯🇵 日本語' }, { code: 'ko', label: '🇰🇷 한국어' },
        { code: 'zh', label: '🇨🇳 中文' }, { code: 'th', label: '🇹🇭 ภาษาไทย' },
      ];

      // ── Product State ──
      var prodName = e.ref('');
      var prodAttrs = e.ref('');

      // ── Blog State ──
      var blogTopic = e.ref('');
      var blogOutline = e.ref('');
      var blogTone = e.ref('professional');

      // ── Sales State ──
      var salesProduct = e.ref('');
      var salesType = e.ref('ad');
      var salesDetails = e.ref('');
      var salesAudience = e.ref('');
      var SALES_TYPES = [
        { code: 'ad', label: '📢 Quảng cáo', desc: 'Google/Facebook Ads' },
        { code: 'email', label: '📧 Email', desc: 'Email Marketing' },
        { code: 'social', label: '📱 Social Media', desc: 'FB, IG, TikTok' },
        { code: 'promo', label: '🏷️ Khuyến mãi', desc: 'Flash Sale, Voucher' },
        { code: 'landing', label: '🌐 Landing Page', desc: 'Trang bán hàng' },
        { code: 'sms', label: '💬 SMS', desc: 'Tin nhắn marketing' },
        { code: 'push', label: '🔔 Push', desc: 'Thông báo push' },
      ];

      // ── SEO State ──
      var seoTitle = e.ref('');
      var seoContent = e.ref('');

      // ── Free State ──
      var freePrompt = e.ref('');
      var freeSystem = e.ref('Bạn là trợ lý nội dung chuyên nghiệp. Trả lời bằng tiếng Việt.');

      // ── Actions ──
      async function doTranslate() {
        if (!trContent.value) { showToast('Nhập nội dung cần dịch', 'error'); return; }
        loading.value = true; result.value = '';
        try {
          // Split by paragraphs for better translation quality
          var paragraphs = trContent.value.split('\n').filter(function(p) { return p.trim(); });
          var translated = [];
          for (var i = 0; i < paragraphs.length; i++) {
            var res = await apiFetch('/languages/auto-translate', {
              method: 'POST',
              body: JSON.stringify({ text: paragraphs[i], from: trFrom.value === 'auto' ? 'vi' : trFrom.value, to: trLang.value })
            });
            var data = await res.json();
            translated.push(data.translated || paragraphs[i]);
          }
          result.value = translated.join('\n');
          showToast('Dịch thành công! (Google Translate)', 'success');
        } catch(err) { showToast('Lỗi dịch: ' + err.message, 'error'); }
        loading.value = false;
      }

      async function doProduct() {
        if (!prodName.value) { showToast('Nhập tên sản phẩm', 'error'); return; }
        loading.value = true; result.value = '';
        try {
          var attrs = {};
          if (prodAttrs.value) {
            prodAttrs.value.split('\n').forEach(function(line) {
              var parts = line.split(':');
              if (parts.length >= 2) attrs[parts[0].trim()] = parts.slice(1).join(':').trim();
            });
          }
          var r = await aiGenerate({ type: 'product', prompt: prodName.value, attributes: attrs });
          result.value = r.content || r;
        } catch(err) { showToast(err.message, 'error'); }
        loading.value = false;
      }

      async function doBlog() {
        if (!blogTopic.value) { showToast('Nhập chủ đề', 'error'); return; }
        loading.value = true; result.value = '';
        try {
          var r = await aiGenerate({ type: 'blog', prompt: blogTopic.value, outline: blogOutline.value, tone: blogTone.value });
          result.value = r.content || r;
        } catch(err) { showToast(err.message, 'error'); }
        loading.value = false;
      }

      async function doSales() {
        if (!salesProduct.value) { showToast('Nhập tên sản phẩm/dịch vụ', 'error'); return; }
        loading.value = true; result.value = '';
        try {
          var r = await aiGenerate({ type: 'sales', prompt: salesProduct.value, copy_type: salesType.value, details: salesDetails.value, target_audience: salesAudience.value });
          result.value = r.content || r;
        } catch(err) { showToast(err.message, 'error'); }
        loading.value = false;
      }

      async function doSeo() {
        if (!seoTitle.value || !seoContent.value) { showToast('Nhập tiêu đề và nội dung', 'error'); return; }
        loading.value = true; result.value = '';
        try {
          var r = await aiGenerate({ type: 'seo', prompt: seoTitle.value, title: seoTitle.value, content: seoContent.value });
          result.value = r.content || r;
        } catch(err) { showToast(err.message, 'error'); }
        loading.value = false;
      }

      async function doFree() {
        if (!freePrompt.value) { showToast('Nhập prompt', 'error'); return; }
        loading.value = true; result.value = '';
        try {
          var r = await aiGenerate({ type: 'general', prompt: freePrompt.value, system: freeSystem.value });
          result.value = r.content || r;
        } catch(err) { showToast(err.message, 'error'); }
        loading.value = false;
      }

      function copyResult() {
        navigator.clipboard.writeText(result.value);
        copied.value = true;
        showToast('Đã copy!', 'success');
        setTimeout(function() { copied.value = false; }, 2000);
      }

      var TABS = [
        { key: 'translate', label: '🌐 Dịch thuật', desc: 'Auto Translate' },
        { key: 'product', label: '📦 Mô tả SP', desc: 'Product Description' },
        { key: 'blog', label: '📝 Viết Blog', desc: 'Blog Generator' },
        { key: 'sales', label: '🚀 Sales Copy', desc: 'Marketing Content' },
        { key: 'seo', label: '🔍 SEO', desc: 'SEO Metadata' },
        { key: 'free', label: '✨ Tự do', desc: 'Free Prompt' },
      ];

      return {
        activeTab, loading, result, copied, TABS, LANGS, SALES_TYPES,
        trContent, trLang, trFrom, doTranslate,
        prodName, prodAttrs, doProduct,
        blogTopic, blogOutline, blogTone, doBlog,
        salesProduct, salesType, salesDetails, salesAudience, doSales,
        seoTitle, seoContent, doSeo,
        freePrompt, freeSystem, doFree,
        copyResult,
      };
    },
    template: '\
<div class="ai">\
  <div class="ai-header">\
    <h3>🤖 AI Assistant</h3>\
    <span class="ai-badge">Powered by AI</span>\
  </div>\
  <div class="ai-tabs">\
    <button v-for="tab in TABS" :key="tab.key" class="ai-tab" :class="{\'ai-tab--active\': activeTab === tab.key}" @click="activeTab = tab.key">\
      <span class="ai-tab-icon">{{ tab.label.split(" ")[0] }}</span>\
      <span class="ai-tab-label">{{ tab.label.split(" ").slice(1).join(" ") }}</span>\
    </button>\
  </div>\
  <div class="ai-body">\
    <div class="ai-panel">\
\
      <!-- TRANSLATE TAB -->\
      <div v-if="activeTab === \'translate\'">\
        <h4>🌐 Dịch tự động</h4>\
        <p class="ai-desc">Dịch nội dung sang nhiều ngôn ngữ. Hỗ trợ dịch sản phẩm, bài viết, CMS.</p>\
        <div class="ai-form">\
          <label>Nội dung cần dịch</label>\
          <textarea v-model="trContent" class="ai-input ai-textarea" rows="5" placeholder="Nhập nội dung cần dịch..."></textarea>\
          <div class="ai-row">\
            <div class="ai-col">\
              <label>Ngôn ngữ nguồn</label>\
              <select v-model="trFrom" class="ai-input">\
                <option value="auto">🔍 Tự nhận diện</option>\
                <option v-for="l in LANGS" :key="l.code" :value="l.code">{{ l.label }}</option>\
              </select>\
            </div>\
            <div class="ai-col">\
              <label>Ngôn ngữ đích</label>\
              <select v-model="trLang" class="ai-input">\
                <option v-for="l in LANGS" :key="l.code" :value="l.code">{{ l.label }}</option>\
              </select>\
            </div>\
          </div>\
          <p class="ai-hint">💡 Dùng Google Translate — miễn phí, không cần API key</p>\
          <button class="ai-btn" :disabled="loading" @click="doTranslate">{{ loading ? "⏳ Đang dịch..." : "🌐 Dịch ngay" }}</button>\
        </div>\
      </div>\
\
      <!-- PRODUCT TAB -->\
      <div v-if="activeTab === \'product\'">\
        <h4>📦 Tạo mô tả sản phẩm</h4>\
        <p class="ai-desc">AI tự động viết mô tả hấp dẫn, SEO-friendly cho sản phẩm.</p>\
        <div class="ai-form">\
          <label>Tên sản phẩm</label>\
          <input v-model="prodName" class="ai-input" placeholder="VD: Áo thun nam cotton premium..." />\
          <label>Thuộc tính (mỗi dòng = key: value)</label>\
          <textarea v-model="prodAttrs" class="ai-input ai-textarea" rows="3" placeholder="Chất liệu: Cotton 100%&#10;Màu: Đen, Trắng, Navy&#10;Size: S, M, L, XL"></textarea>\
          <button class="ai-btn" :disabled="loading" @click="doProduct">{{ loading ? "⏳ Đang tạo..." : "📦 Tạo mô tả" }}</button>\
        </div>\
      </div>\
\
      <!-- BLOG TAB -->\
      <div v-if="activeTab === \'blog\'">\
        <h4>📝 Viết Blog</h4>\
        <p class="ai-desc">AI viết bài blog hoàn chỉnh từ chủ đề, có heading, SEO-friendly.</p>\
        <div class="ai-form">\
          <label>Chủ đề</label>\
          <input v-model="blogTopic" class="ai-input" placeholder="VD: Xu hướng thời trang 2026..." />\
          <label>Dàn ý (tùy chọn)</label>\
          <textarea v-model="blogOutline" class="ai-input ai-textarea" rows="3" placeholder="- Giới thiệu&#10;- Xu hướng 1&#10;- Xu hướng 2&#10;- Kết luận"></textarea>\
          <label>Giọng văn</label>\
          <select v-model="blogTone" class="ai-input">\
            <option value="professional">Chuyên nghiệp</option>\
            <option value="friendly">Thân thiện</option>\
            <option value="casual">Thoải mái</option>\
            <option value="academic">Học thuật</option>\
          </select>\
          <button class="ai-btn" :disabled="loading" @click="doBlog">{{ loading ? "⏳ Đang viết..." : "📝 Viết blog" }}</button>\
        </div>\
      </div>\
\
      <!-- SALES COPY TAB -->\
      <div v-if="activeTab === \'sales\'">\
        <h4>🚀 Sales Copy Generator</h4>\
        <p class="ai-desc">Tạo nội dung marketing chuyên nghiệp: Ads, Email, Social, Landing Page...</p>\
        <div class="ai-form">\
          <label>Sản phẩm / Dịch vụ</label>\
          <input v-model="salesProduct" class="ai-input" placeholder="VD: Khóa học Marketing Online..." />\
          <label>Loại nội dung</label>\
          <div class="ai-type-grid">\
            <button v-for="st in SALES_TYPES" :key="st.code" class="ai-type-btn" :class="{\'ai-type-btn--active\': salesType === st.code}" @click="salesType = st.code">\
              <span>{{ st.label }}</span>\
              <small>{{ st.desc }}</small>\
            </button>\
          </div>\
          <label>Chi tiết (tùy chọn)</label>\
          <textarea v-model="salesDetails" class="ai-input ai-textarea" rows="2" placeholder="Giảm giá 50%, miễn phí ship, ưu đãi đặc biệt..."></textarea>\
          <label>Đối tượng mục tiêu</label>\
          <input v-model="salesAudience" class="ai-input" placeholder="VD: Phụ nữ 25-40 tuổi, quan tâm skincare..." />\
          <button class="ai-btn ai-btn--sales" :disabled="loading" @click="doSales">{{ loading ? "⏳ Đang tạo..." : "🚀 Tạo Sales Copy" }}</button>\
        </div>\
      </div>\
\
      <!-- SEO TAB -->\
      <div v-if="activeTab === \'seo\'">\
        <h4>🔍 Tạo SEO Metadata</h4>\
        <p class="ai-desc">AI phân tích nội dung và tạo meta title, description, keywords tối ưu.</p>\
        <div class="ai-form">\
          <label>Tiêu đề trang</label>\
          <input v-model="seoTitle" class="ai-input" placeholder="VD: Bộ sưu tập mùa hè 2026" />\
          <label>Nội dung trang</label>\
          <textarea v-model="seoContent" class="ai-input ai-textarea" rows="5" placeholder="Dán nội dung cần phân tích SEO..."></textarea>\
          <button class="ai-btn" :disabled="loading" @click="doSeo">{{ loading ? "⏳ Đang phân tích..." : "🔍 Phân tích SEO" }}</button>\
        </div>\
      </div>\
\
      <!-- FREE TAB -->\
      <div v-if="activeTab === \'free\'">\
        <h4>✨ Tự do</h4>\
        <p class="ai-desc">Chat tự do với AI — viết, tóm tắt, phân tích, bất cứ gì bạn cần.</p>\
        <div class="ai-form">\
          <label>System Prompt (tuỳ chọn)</label>\
          <input v-model="freeSystem" class="ai-input" />\
          <label>Prompt</label>\
          <textarea v-model="freePrompt" class="ai-input ai-textarea" rows="5" placeholder="Nhập yêu cầu..."></textarea>\
          <button class="ai-btn" :disabled="loading" @click="doFree">{{ loading ? "⏳ Đang xử lý..." : "✨ Tạo nội dung" }}</button>\
        </div>\
      </div>\
    </div>\
\
    <!-- RESULT PANEL -->\
    <div class="ai-result" v-if="result">\
      <div class="ai-result-header">\
        <h4>📋 Kết quả</h4>\
        <button class="ai-copy" @click="copyResult">{{ copied ? "✅ Đã copy" : "📋 Copy" }}</button>\
      </div>\
      <div class="ai-result-body">\
        <pre class="ai-result-text">{{ result }}</pre>\
      </div>\
    </div>\
    <div v-if="loading" class="ai-loading">\
      <div class="ai-spinner"></div>\
      <span>AI đang xử lý...</span>\
    </div>\
  </div>\
</div>'
  };

  // ── Register hooks ──
  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) {
      items.push({ key: 'ai-assistant', label: t('ai.title', 'AI Assistant'), icon: 'Bot', featureGroup: null, moduleId: 'ai-assistant' });
      return items;
    });
    hooks.addFilter('admin_routes', function(config) {
      Object.assign(config.routeToTab, { 'ai-assistant': 'ai-assistant' });
      return config;
    });
  }

  var plugin = {
    id: 'ai-assistant',
    name: 'AI Assistant',
    version: '1.0.0',
    components: { 'ai-assistant': e.markRaw(AiAssistant) },
    sidebar: { group: 'Công cụ', items: [{ key: 'ai-assistant', label: 'AI Assistant', icon: 'Bot', route: 'ai-assistant' }] }
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['ai-assistant'] = plugin;
  return plugin;
})(Vue);
