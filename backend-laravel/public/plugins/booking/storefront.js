/**
 * Booking Plugin — Storefront UI
 */
(function(Vue, Lucide) {
  'use strict';
  var bridge = window.__SF_BRIDGE__;
  var Clock = Lucide.Clock;
  var Calendar = Lucide.Calendar;
  var User = Lucide.User;
  var CheckCircle = Lucide.CheckCircle;

  function formatMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var BookingServices = {
    name: 'BookingServices',
    components: { Clock: Clock },
    setup: function() {
      var services = Vue.ref([]);
      var loading = Vue.ref(true);

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/booking/services');
          services.value = res.data || res || [];
        } catch(e) {}
        loading.value = false;
      });

      return { services: services, loading: loading, formatMoney: formatMoney };
    },
    template: '\
<div class="sf-booking-services container section" style="padding: 40px 0; min-height: 60vh;">\
  <h1 class="page-title" style="margin-bottom: 32px; text-align: center;">Dịch vụ của chúng tôi</h1>\
  <div v-if="loading" class="text-center">Đang tải danh sách dịch vụ...</div>\
  <div v-else-if="services.length === 0" class="empty-state">Chưa có dịch vụ nào.</div>\
  <div v-else class="services-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">\
    <div v-for="srv in services" :key="srv.id" class="service-card" style="border: 1px solid var(--sf-border); border-radius: 12px; padding: 24px; background: var(--sf-bg-card); display: flex; flex-direction: column;">\
      <h3 style="margin: 0 0 12px; font-size: 18px;">{{ srv.name }}</h3>\
      <p style="color: var(--sf-text-muted); font-size: 14px; margin: 0 0 16px; flex: 1;">{{ srv.description || srv.excerpt || \'\' }}</p>\
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">\
        <div style="font-weight: 700; color: var(--sf-accent);">{{ formatMoney(srv.price) }}</div>\
        <div style="display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--sf-text-muted);"><Clock :size="14" /> {{ srv.duration }} phút</div>\
      </div>\
      <router-link :to="\'/booking?service=\' + srv.id" class="btn btn--outline" style="text-align: center; width: 100%;">Đặt lịch ngay</router-link>\
    </div>\
  </div>\
</div>'
  };

  var BookingForm = {
    name: 'BookingForm',
    components: { Calendar: Calendar, User: User, CheckCircle: CheckCircle },
    setup: function() {
      var route = Vue.inject('route', { query: {} }); // Mock router route since we can't fully import useRoute easily
      // Better way to get query param in bundle
      var searchParams = new URLSearchParams(window.location.search);
      var preselectedService = searchParams.get('service');

      var services = Vue.ref([]);
      var state = Vue.reactive({
        form: { service_id: preselectedService || '', customer_name: '', customer_phone: '', booking_date: '', time_slot: '', notes: '' },
        submitting: false,
        success: false
      });

      var timeSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/booking/services');
          services.value = res.data || res || [];
          if (!state.form.service_id && services.value.length > 0) {
            state.form.service_id = services.value[0].id;
          }
        } catch(e) {}
      });

      async function submit() {
        state.submitting = true;
        try {
          await bridge.apiFetch('/booking/appointments', {
            method: 'POST',
            body: JSON.stringify(state.form)
          });
          state.success = true;
        } catch(e) {
          alert('Có lỗi xảy ra, vui lòng thử lại.');
        }
        state.submitting = false;
      }

      return { state: state, services: services, submit: submit, formatMoney: formatMoney, timeSlots: timeSlots };
    },
    template: '\
<div class="sf-booking-form container section" style="padding: 40px 0; max-width: 600px; min-height: 60vh;">\
  <div v-if="state.success" style="text-align: center; padding: 40px; background: var(--sf-bg-surface); border-radius: 16px; border: 1px solid var(--sf-border);">\
    <CheckCircle :size="64" style="color: #10b981; margin: 0 auto 24px;" />\
    <h2>Đặt lịch thành công!</h2>\
    <p style="color: var(--sf-text-muted); margin-bottom: 24px;">Cảm ơn bạn. Chúng tôi sẽ liên hệ lại sớm để xác nhận lịch hẹn của bạn.</p>\
    <router-link to="/" class="btn btn--primary">Trở về trang chủ</router-link>\
  </div>\
  <div v-else style="background: var(--sf-bg-surface); border: 1px solid var(--sf-border); border-radius: 16px; padding: 32px;">\
    <h1 style="margin: 0 0 24px; font-size: 24px;">Đặt lịch hẹn</h1>\
    <form @submit.prevent="submit" style="display: flex; flex-direction: column; gap: 20px;">\
      <div>\
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Dịch vụ *</label>\
        <select v-model="state.form.service_id" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" required>\
          <option value="">-- Chọn dịch vụ --</option>\
          <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }} ({{ formatMoney(s.price) }})</option>\
        </select>\
      </div>\
      <div style="display: flex; gap: 16px;">\
        <div style="flex: 1;">\
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Họ tên *</label>\
          <input v-model="state.form.customer_name" type="text" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" required />\
        </div>\
        <div style="flex: 1;">\
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Số điện thoại *</label>\
          <input v-model="state.form.customer_phone" type="tel" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" required />\
        </div>\
      </div>\
      <div style="display: flex; gap: 16px;">\
        <div style="flex: 1;">\
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Ngày *</label>\
          <input v-model="state.form.booking_date" type="date" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" required />\
        </div>\
        <div style="flex: 1;">\
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Giờ *</label>\
          <select v-model="state.form.time_slot" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" required>\
            <option value="">-- Chọn giờ --</option>\
            <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>\
          </select>\
        </div>\
      </div>\
      <div>\
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Ghi chú thêm</label>\
        <textarea v-model="state.form.notes" rows="3" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;"></textarea>\
      </div>\
      <button type="submit" class="btn btn--primary" style="padding: 14px; font-size: 16px; border-radius: 8px;" :disabled="state.submitting">\
        {{ state.submitting ? \'Đang xử lý...\' : \'Xác nhận Đặt lịch\' }}\
      </button>\
    </form>\
  </div>\
</div>'
  };

  // ── Homepage Preview Block ──
  var BookingServicesPreview = {
    name: 'BookingServicesPreview',
    props: {
      title: { type: String, default: 'Dịch Vụ Nổi Bật' },
      subtitle: { type: String, default: 'Đặt lịch dễ dàng, nhanh chóng' },
      count: { type: [Number, String], default: 6 }
    },
    components: { Clock: Clock },
    setup: function(props) {
      var services = Vue.ref([]);
      var loading = Vue.ref(true);
      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/booking/services');
          services.value = (res.data || res || []).slice(0, Number(props.count) || 6);
        } catch(e) {}
        loading.value = false;
      });
      return { services: services, loading: loading, formatMoney: formatMoney };
    },
    template: '\
<div class="sf-booking-preview container section" style="padding: 60px 0;">\
  <div style="text-align: center; margin-bottom: 40px;">\
    <h2 style="font-size: 32px; font-weight: 800; margin: 0 0 12px;">{{ title }}</h2>\
    <p style="color: var(--sf-text-muted); font-size: 16px; max-width: 500px; margin: 0 auto;">{{ subtitle }}</p>\
  </div>\
  <div v-if="loading" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Đang tải...</div>\
  <div v-else-if="services.length === 0" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Chưa có dịch vụ.</div>\
  <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">\
    <div v-for="srv in services" :key="srv.id" style="border: 1px solid var(--sf-border); border-radius: 16px; padding: 28px; background: var(--sf-bg-card); display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;">\
      <h3 style="margin: 0 0 10px; font-size: 18px; font-weight: 700;">{{ srv.name }}</h3>\
      <p style="color: var(--sf-text-muted); font-size: 14px; margin: 0 0 16px; flex: 1; line-height: 1.5;">{{ srv.description || srv.excerpt || \'\'  }}</p>\
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--sf-border); padding-top: 16px;">\
        <span style="font-weight: 700; color: var(--sf-accent); font-size: 18px;">{{ formatMoney(srv.price) }}</span>\
        <span style="display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--sf-text-muted);"><Clock :size="14" /> {{ srv.duration }} phút</span>\
      </div>\
    </div>\
  </div>\
  <div style="text-align: center; margin-top: 32px;">\
    <router-link to="/services" class="btn btn--outline" style="padding: 12px 32px; border-radius: 8px;">Xem tất cả dịch vụ →</router-link>\
  </div>\
</div>'
  };

  // Shortcode registry
  window.__STOREFRONT_SHORTCODES__ = window.__STOREFRONT_SHORTCODES__ || {};
  window.__STOREFRONT_SHORTCODES__['booking-services'] = BookingServicesPreview;

  if (bridge) {
    bridge.registerPlugin('booking', {
      routes: [
        { path: '/services', name: 'booking-services', component: BookingServices },
        { path: '/booking', name: 'booking-form', component: BookingForm }
      ],
      homeSections: [
        { type: 'booking_services', component: BookingServicesPreview, order: 1 }
      ]
    });
  }

})(window.Vue, window.LucideVueNext);
