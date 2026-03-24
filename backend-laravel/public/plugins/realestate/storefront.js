/**
 * Real Estate Plugin — Storefront UI
 */
(function(Vue, Lucide) {
  'use strict';
  var bridge = window.__SF_BRIDGE__;
  var MapPin = Lucide.MapPin;
  var Bed = Lucide.BedDouble;
  var Bath = Lucide.Bath;
  var Maximize = Lucide.Maximize;
  var CheckCircle = Lucide.CheckCircle;

  function formatMoney(v) { 
    if (!v) return 'Liên hệ';
    if (v >= 1000000000) return (v / 1000000000).toLocaleString('vi-VN', {maximumFractionDigits: 1}) + ' Tỷ';
    if (v >= 1000000) return (v / 1000000).toLocaleString('vi-VN') + ' Triệu';
    return v.toLocaleString('vi-VN') + 'đ';
  }

  function parseMeta(meta) { try { return typeof meta === 'string' ? JSON.parse(meta) : meta; } catch(e) { return {}; } }

  var ListingsIndex = {
    name: 'ListingsIndex',
    components: { MapPin: MapPin, Bed: Bed, Bath: Bath, Maximize: Maximize },
    setup: function() {
      var listings = Vue.ref([]);
      var loading = Vue.ref(true);

      var route = Vue.inject('route', { query: {} });
      var searchParams = new URLSearchParams(window.location.search);
      var typeFilter = searchParams.get('type');

      Vue.onMounted(async function() {
        try {
          var url = '/listings';
          var res = await bridge.apiFetch(url);
          var all = res.data || res || [];
          if (typeFilter) {
            listings.value = all.filter(function(item) {
               var meta = parseMeta(item.meta);
               return meta.listing_type === typeFilter;
            });
          } else {
            listings.value = all;
          }
        } catch(e) {}
        loading.value = false;
      });

      return { listings: listings, loading: loading, formatMoney: formatMoney, parseMeta: parseMeta, typeFilter: typeFilter };
    },
    template: '\
<div class="sf-realestate-list container section" style="padding: 40px 0; min-height: 60vh;">\
  <h1 class="page-title" style="margin-bottom: 32px;">Danh sách Bất Động Sản {{ typeFilter==="rent" ? "Cho Thuê" : typeFilter==="sale" ? "Đang Bán" : "" }}</h1>\
  <div v-if="loading" class="text-center">Đang tải danh sách...</div>\
  <div v-else-if="listings.length === 0" class="empty-state">Không tìm thấy bất động sản nào phù hợp.</div>\
  <div v-else class="realestate-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">\
    <router-link v-for="item in listings" :key="item.id" :to="\'/listings/\' + item.id" class="property-card" style="border: 1px solid var(--sf-border); border-radius: 12px; overflow: hidden; background: var(--sf-bg-card); display: flex; flex-direction: column; text-decoration: none; color: inherit; transition: box-shadow 0.2s;">\
      <div style="position: relative;">\
        <img :src="item.featured_image || \'https://placehold.co/600x400?text=Property\'" :alt="item.title" style="width: 100%; height: 220px; object-fit: cover;" />\
        <span style="position: absolute; top: 12px; left: 12px; background: var(--sf-accent); color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">{{ parseMeta(item.meta).listing_type === \'rent\' ? \'CHO THUÊ\' : \'BÁN\' }}</span>\
      </div>\
      <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">\
        <div style="font-size: 20px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">{{ formatMoney(parseMeta(item.meta).price) }}</div>\
        <h3 style="margin: 0 0 12px; font-size: 16px; line-height: 1.4;">{{ item.title }}</h3>\
        <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--sf-text-muted); margin-bottom: 16px;"><MapPin :size="14" /> {{ parseMeta(item.meta).location || "Chưa cập nhật địa điểm" }}</div>\
        <div style="margin-top: auto; display: flex; gap: 16px; font-size: 13px; color: var(--sf-text-secondary); border-top: 1px solid var(--sf-border); padding-top: 16px;">\
          <div style="display: flex; align-items: center; gap: 6px;" title="Diện tích"><Maximize :size="16" /> {{ parseMeta(item.meta).area }} m²</div>\
          <div style="display: flex; align-items: center; gap: 6px;" title="Phòng ngủ"><Bed :size="16" /> {{ parseMeta(item.meta).bedrooms || 0 }}</div>\
          <div style="display: flex; align-items: center; gap: 6px;" title="Phòng tắm"><Bath :size="16" /> {{ parseMeta(item.meta).bathrooms || 0 }}</div>\
        </div>\
      </div>\
    </router-link>\
  </div>\
</div>'
  };

  var ListingDetail = {
    name: 'ListingDetail',
    components: { MapPin: MapPin, Bed: Bed, Bath: Bath, Maximize: Maximize, CheckCircle: CheckCircle },
    props: ['id'],
    setup: function(props) {
      var item = Vue.ref(null);
      var loading = Vue.ref(true);

      var state = Vue.reactive({
        form: { name: '', phone: '', email: '', message: 'Tôi quan tâm đến bất động sản này và muốn nhận thêm thông tin tư vấn.' },
        submitting: false,
        success: false
      });

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/listings/' + props.id);
          item.value = res.data || res;
        } catch(e) {}
        loading.value = false;
      });

      async function submit() {
        state.submitting = true;
        try {
          await bridge.apiFetch('/listings/' + props.id + '/inquiry', {
            method: 'POST',
            body: JSON.stringify(state.form)
          });
          state.success = true;
        } catch(e) {
          alert('Gửi yêu cầu thất bại. Vui lòng thử lại sau.');
        }
        state.submitting = false;
      }

      return { item: item, loading: loading, state: state, submit: submit, formatMoney: formatMoney, parseMeta: parseMeta };
    },
    template: '\
<div class="sf-realestate-detail container section" style="padding: 40px 0;">\
  <div v-if="loading" class="text-center">Đang tải chi tiết...</div>\
  <div v-else-if="!item">Không tìm thấy bất động sản.</div>\
  <div v-else class="listing-layout" style="display: flex; flex-wrap: wrap; gap: 40px;">\
    <div class="listing-main" style="flex: 1; min-width: 300px;">\
      <div style="position: relative; margin-bottom: 24px;">\
        <img :src="item.featured_image || \'https://placehold.co/1200x600?text=Property\'" :alt="item.title" style="width: 100%; border-radius: 16px; object-fit: cover; max-height: 500px;" />\
        <span style="position: absolute; top: 16px; left: 16px; background: var(--sf-accent); color: white; padding: 6px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; text-transform: uppercase;">\
          {{ parseMeta(item.meta).listing_type === \'rent\' ? \'CHO THUÊ\' : \'BÁN\' }}\
        </span>\
      </div>\
      \
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">\
        <h1 style="margin: 0; font-size: 28px; line-height: 1.3; flex: 1; min-width: 300px;">{{ item.title }}</h1>\
        <div style="font-size: 32px; font-weight: 700; color: #ef4444;">{{ formatMoney(parseMeta(item.meta).price) }}</div>\
      </div>\
      \
      <div style="display: flex; align-items: center; gap: 6px; font-size: 16px; color: var(--sf-text-muted); margin-bottom: 32px;">\
        <MapPin :size="18" /> {{ parseMeta(item.meta).location || "Chưa cập nhật địa điểm" }}\
      </div>\
      \
      <div style="display: flex; gap: 32px; flex-wrap: wrap; padding: 24px; background: var(--sf-bg-surface); border-radius: 12px; border: 1px solid var(--sf-border); margin-bottom: 32px;">\
        <div style="display: flex; flex-direction: column; gap: 8px;">\
          <span style="color: var(--sf-text-muted); font-size: 14px;">Diện tích</span>\
          <div style="display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600;"><Maximize :size="20" style="color:var(--sf-accent)" /> {{ parseMeta(item.meta).area }} m²</div>\
        </div>\
        <div style="display: flex; flex-direction: column; gap: 8px;">\
          <span style="color: var(--sf-text-muted); font-size: 14px;">Phòng ngủ</span>\
          <div style="display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600;"><Bed :size="20" style="color:var(--sf-accent)" /> {{ parseMeta(item.meta).bedrooms || 0 }}</div>\
        </div>\
        <div style="display: flex; flex-direction: column; gap: 8px;">\
          <span style="color: var(--sf-text-muted); font-size: 14px;">Phòng tắm</span>\
          <div style="display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600;"><Bath :size="20" style="color:var(--sf-accent)" /> {{ parseMeta(item.meta).bathrooms || 0 }}</div>\
        </div>\
      </div>\
      \
      <h3>Mô tả chi tiết</h3>\
      <div v-html="item.body" class="sf-html-content" style="line-height: 1.8; color: var(--sf-text-secondary); margin-bottom: 40px;"></div>\
    </div>\
    \
    <div class="listing-sidebar" style="width: 380px; flex-shrink: 0;">\
      <div class="sidebar-box" style="background: var(--sf-bg-surface); border: 1px solid var(--sf-border); border-radius: 16px; padding: 32px; position: sticky; top: 100px;">\
        <h3 style="margin-top: 0; margin-bottom: 8px;">Nhận tư vấn miễn phí</h3>\
        <p style="color: var(--sf-text-muted); font-size: 14px; margin-bottom: 24px;">Để lại thông tin, chuyên viên của chúng tôi sẽ liên hệ trong ít phút.</p>\
        \
        <div v-if="state.success" style="text-align: center; padding: 24px 0;">\
          <CheckCircle :size="48" style="color: #10b981; margin: 0 auto 16px;" />\
          <h4 style="margin: 0;">Đã gửi yêu cầu!</h4>\
        </div>\
        <form v-else @submit.prevent="submit" style="display: flex; flex-direction: column; gap: 16px;">\
          <input v-model="state.form.name" type="text" class="sf-input" placeholder="Họ tên của bạn *" required style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" />\
          <input v-model="state.form.phone" type="tel" class="sf-input" placeholder="Số điện thoại *" required style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" />\
          <input v-model="state.form.email" type="email" class="sf-input" placeholder="Email" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" />\
          <textarea v-model="state.form.message" class="sf-input" rows="4" placeholder="Lời nhắn" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px; resize: none;"></textarea>\
          <button type="submit" class="btn btn--primary" style="padding: 14px; font-size: 15px; border-radius: 8px;" :disabled="state.submitting">\
            {{ state.submitting ? \'Đang gửi...\' : \'Yêu cầu Tư vấn\' }}\
          </button>\
        </form>\
      </div>\
    </div>\
  </div>\
</div>'
  };

  // ── Homepage Preview Block ──
  var PropertyListingsPreview = {
    name: 'PropertyListingsPreview',
    props: {
      title: { type: String, default: 'Bất Động Sản Nổi Bật' },
      subtitle: { type: String, default: 'Tìm ngôi nhà mơ ước của bạn' },
      count: { type: [Number, String], default: 6 }
    },
    components: { MapPin: MapPin, Bed: Bed, Bath: Bath, Maximize: Maximize },
    setup: function(props) {
      var listings = Vue.ref([]);
      var loading = Vue.ref(true);
      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/listings');
          listings.value = (res.data || res || []).slice(0, Number(props.count) || 6);
        } catch(e) {}
        loading.value = false;
      });
      return { listings: listings, loading: loading, formatMoney: formatMoney, parseMeta: parseMeta };
    },
    template: '\
<div class="sf-realestate-preview container section" style="padding: 60px 0;">\
  <div style="text-align: center; margin-bottom: 40px;">\
    <h2 style="font-size: 32px; font-weight: 800; margin: 0 0 12px;">{{ title }}</h2>\
    <p style="color: var(--sf-text-muted); font-size: 16px; max-width: 500px; margin: 0 auto;">{{ subtitle }}</p>\
  </div>\
  <div v-if="loading" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Đang tải...</div>\
  <div v-else-if="listings.length === 0" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Chưa có bất động sản.</div>\
  <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">\
    <router-link v-for="item in listings" :key="item.id" :to="\'/listings/\' + item.id" style="border: 1px solid var(--sf-border); border-radius: 14px; overflow: hidden; background: var(--sf-bg-card); text-decoration: none; color: inherit; transition: box-shadow 0.2s, transform 0.15s;">\
      <div style="position: relative;">\
        <img :src="item.featured_image || \'https://placehold.co/600x400?text=BDS\'" :alt="item.title" style="width: 100%; height: 200px; object-fit: cover;" />\
        <span style="position: absolute; top: 10px; left: 10px; background: var(--sf-accent); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">{{ parseMeta(item.meta).listing_type === \'rent\' ? \'CHO THUÊ\' : \'BÁN\' }}</span>\
      </div>\
      <div style="padding: 18px;">\
        <div style="font-size: 20px; font-weight: 700; color: #ef4444; margin-bottom: 6px;">{{ formatMoney(parseMeta(item.meta).price) }}</div>\
        <h3 style="margin: 0 0 10px; font-size: 15px; line-height: 1.4;">{{ item.title }}</h3>\
        <div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--sf-text-muted); margin-bottom: 14px;"><MapPin :size="13" /> {{ parseMeta(item.meta).location || \'Chưa cập nhật\' }}</div>\
        <div style="display: flex; gap: 16px; font-size: 12px; color: var(--sf-text-secondary); border-top: 1px solid var(--sf-border); padding-top: 14px;">\
          <span style="display: flex; align-items: center; gap: 4px;"><Maximize :size="14" /> {{ parseMeta(item.meta).area }} m²</span>\
          <span style="display: flex; align-items: center; gap: 4px;"><Bed :size="14" /> {{ parseMeta(item.meta).bedrooms || 0 }} PN</span>\
          <span style="display: flex; align-items: center; gap: 4px;"><Bath :size="14" /> {{ parseMeta(item.meta).bathrooms || 0 }} PT</span>\
        </div>\
      </div>\
    </router-link>\
  </div>\
  <div style="text-align: center; margin-top: 32px;">\
    <router-link to="/listings" class="btn btn--outline" style="padding: 12px 32px; border-radius: 8px;">Xem tất cả bất động sản →</router-link>\
  </div>\
</div>'
  };

  // Shortcode registry
  window.__STOREFRONT_SHORTCODES__ = window.__STOREFRONT_SHORTCODES__ || {};
  window.__STOREFRONT_SHORTCODES__['property-listings'] = PropertyListingsPreview;

  if (bridge) {
    bridge.registerPlugin('realestate', {
      routes: [
        { path: '/listings', name: 'properties-list', component: ListingsIndex },
        { path: '/listings/:id', name: 'property-detail', component: ListingDetail, props: true }
      ],
      homeSections: [
        { type: 'property_listings', component: PropertyListingsPreview, order: 1 }
      ]
    });
  }

})(window.Vue, window.LucideVueNext);
