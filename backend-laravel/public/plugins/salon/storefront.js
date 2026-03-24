/**
 * Salon Plugin — Storefront UI
 */
(function(Vue, Lucide) {
  'use strict';
  var bridge = window.__SF_BRIDGE__;
  var Clock = Lucide.Clock;
  var Calendar = Lucide.Calendar;
  var User = Lucide.User;
  var Scissors = Lucide.Scissors;
  var CheckCircle = Lucide.CheckCircle;

  function formatMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var SalonServices = {
    name: 'SalonServices',
    components: { Clock: Clock, Scissors: Scissors },
    setup: function() {
      var services = Vue.ref([]);
      var categories = Vue.ref([]);
      var staff = Vue.ref([]);
      var loading = Vue.ref(true);

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/salon/services');
          var allServices = res.data || res || [];
          services.value = allServices;
          
          // group by category if needed, here we just list them
          var cats = new Set();
          allServices.forEach(function(s) { if(s.category_id) cats.add(s.category_id); });
          categories.value = Array.from(cats);

          var staffRes = await bridge.apiFetch('/salon/staff');
          staff.value = staffRes.data || staffRes || [];
        } catch(e) {}
        loading.value = false;
      });

      return { services: services, staff: staff, loading: loading, formatMoney: formatMoney };
    },
    template: '\
<div class="sf-salon-services container section" style="padding: 40px 0; min-height: 60vh;">\
  <h1 class="page-title" style="margin-bottom: 40px; text-align: center;">Bảng Giá Dịch Vụ</h1>\
  <div v-if="loading" class="text-center">Đang tải bảng giá...</div>\
  <div v-else-if="services.length === 0" class="empty-state">Chưa có dịch vụ nào.</div>\
  <div v-else style="display: flex; flex-direction: column; gap: 40px;">\
    <div class="services-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">\
      <div v-for="srv in services" :key="srv.id" class="service-item" style="border: 1px solid var(--sf-border); border-radius: 12px; padding: 24px; background: var(--sf-bg-surface); display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;">\
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">\
          <h3 style="margin: 0; font-size: 18px; flex: 1; padding-right: 16px;">{{ srv.name }}</h3>\
          <div style="font-weight: 700; color: var(--sf-accent); font-size: 18px;">{{ formatMoney(srv.price) }}</div>\
        </div>\
        <p style="color: var(--sf-text-muted); font-size: 14px; margin: 0 0 16px; flex: 1; line-height: 1.5;">{{ srv.description || srv.excerpt || \'Giúp bạn thư giãn và làm mới bản thân.\' }}</p>\
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--sf-border); padding-top: 16px;">\
          <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--sf-text-secondary);"><Clock :size="14" /> {{ srv.duration }} phút</div>\
          <router-link :to="\'/booking?service=\' + srv.id" class="btn btn--outline btn--sm" style="border-radius: 6px;">Đặt lịch</router-link>\
        </div>\
      </div>\
    </div>\
    \
    <div v-if="staff.length > 0" style="margin-top: 20px;">\
      <h2 style="margin-bottom: 24px; text-align: center;">Đội Ngũ Chuyên Gia</h2>\
      <div class="staff-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px;">\
        <div v-for="st in staff" :key="st.id" class="staff-card" style="text-align: center; border: 1px solid var(--sf-border); border-radius: 12px; padding: 24px; background: var(--sf-bg-surface);">\
          <img :src="st.avatar || \'https://placehold.co/150x150?text=\'+st.name" :alt="st.name" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 3px solid var(--sf-bg-card);" />\
          <h4 style="margin: 0 0 8px; font-size: 16px;">{{ st.name }}</h4>\
          <div style="font-size: 13px; color: var(--sf-accent); font-weight: 500;">{{ typeof st.specialties === \'string\' ? JSON.parse(st.specialties).join(\', \') : (st.specialties ? st.specialties.join(\', \') : \'Chuyên gia\') }}</div>\
        </div>\
      </div>\
    </div>\
  </div>\
</div>'
  };

  var SalonBooking = {
    name: 'SalonBooking',
    components: { Calendar: Calendar, User: User, CheckCircle: CheckCircle },
    setup: function() {
      var searchParams = new URLSearchParams(window.location.search);
      var preselectedService = searchParams.get('service');

      var services = Vue.ref([]);
      var staffList = Vue.ref([]);
      
      var state = Vue.reactive({
        form: { 
          service_id: preselectedService || '', 
          staff_id: '',
          customer_name: '', 
          customer_phone: '', 
          booking_date: '', 
          time_slot: '', 
          notes: '' 
        },
        submitting: false,
        success: false
      });

      var timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/salon/services');
          services.value = res.data || res || [];
          
          var staffRes = await bridge.apiFetch('/salon/staff');
          staffList.value = staffRes.data || staffRes || [];
        } catch(e) {}
      });

      async function submit() {
        state.submitting = true;
        try {
          await bridge.apiFetch('/salon/appointments', {
            method: 'POST',
            body: JSON.stringify(state.form)
          });
          state.success = true;
        } catch(e) {
          alert('Có lỗi xảy ra, vui lòng thử lại.');
        }
        state.submitting = false;
      }

      return { state: state, services: services, staffList: staffList, submit: submit, formatMoney: formatMoney, timeSlots: timeSlots };
    },
    template: '\
<div class="sf-salon-booking container section" style="padding: 40px 0; max-width: 600px; min-height: 60vh;">\
  <div v-if="state.success" style="text-align: center; padding: 40px; background: var(--sf-bg-surface); border-radius: 16px; border: 1px solid var(--sf-border);">\
    <CheckCircle :size="64" style="color: #10b981; margin: 0 auto 24px;" />\
    <h2>Đặt lịch thành công!</h2>\
    <p style="color: var(--sf-text-muted); margin-bottom: 24px;">Cảm ơn bạn. Chúng tôi sẽ liên hệ lại sớm để xác nhận lịch hẹn của bạn.</p>\
    <router-link to="/" class="btn btn--primary">Trở về trang chủ</router-link>\
  </div>\
  <div v-else style="background: var(--sf-bg-surface); border: 1px solid var(--sf-border); border-radius: 16px; padding: 32px;">\
    <h1 style="margin: 0 0 24px; font-size: 24px;">Đặt lịch Spa & Salon</h1>\
    <form @submit.prevent="submit" style="display: flex; flex-direction: column; gap: 20px;">\
      <div>\
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Dịch vụ yêu thích *</label>\
        <select v-model="state.form.service_id" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;" required>\
          <option value="">-- Chọn dịch vụ --</option>\
          <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }} ({{ formatMoney(s.price) }})</option>\
        </select>\
      </div>\
      <div v-if="staffList.length > 0">\
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Chọn chuyên viên (Tùy chọn)</label>\
        <select v-model="state.form.staff_id" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 12px;">\
          <option value="">-- Không yêu cầu --</option>\
          <option v-for="st in staffList" :key="st.id" :value="st.id">{{ st.name }}</option>\
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
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Ngày hẹn *</label>\
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
      <button type="submit" class="btn btn--primary" style="padding: 14px; font-size: 16px; border-radius: 8px; margin-top: 8px;" :disabled="state.submitting">\
        {{ state.submitting ? \'Đang xử lý...\' : \'Xác nhận Đặt lịch\' }}\
      </button>\
    </form>\
  </div>\
</div>'
  };

  // ── Homepage Preview Block ──
  var SalonServicesPreview = {
    name: 'SalonServicesPreview',
    props: {
      title: { type: String, default: 'Dịch Vụ Spa & Salon' },
      subtitle: { type: String, default: 'Thư giãn và làm mới bản thân với đội ngũ chuyên gia hàng đầu' },
      count: { type: [Number, String], default: 6 }
    },
    components: { Clock: Clock, Scissors: Scissors },
    setup: function(props) {
      var services = Vue.ref([]);
      var staff = Vue.ref([]);
      var loading = Vue.ref(true);
      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/salon/services');
          services.value = (res.data || res || []).slice(0, Number(props.count) || 6);
          var sRes = await bridge.apiFetch('/salon/staff');
          staff.value = (sRes.data || sRes || []).slice(0, 4);
        } catch(e) {}
        loading.value = false;
      });
      return { services: services, staff: staff, loading: loading, formatMoney: formatMoney };
    },
    template: '\
<div class="sf-salon-preview container section" style="padding: 60px 0;">\
  <div style="text-align: center; margin-bottom: 40px;">\
    <h2 style="font-size: 32px; font-weight: 800; margin: 0 0 12px;">{{ title }}</h2>\
    <p style="color: var(--sf-text-muted); font-size: 16px; max-width: 550px; margin: 0 auto;">{{ subtitle }}</p>\
  </div>\
  <div v-if="loading" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Đang tải...</div>\
  <div v-else>\
    <div v-if="services.length" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 48px;">\
      <div v-for="srv in services" :key="srv.id" style="border: 1px solid var(--sf-border); border-radius: 14px; padding: 24px; background: var(--sf-bg-card); display: flex; flex-direction: column;">\
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">\
          <h3 style="margin: 0; font-size: 17px; font-weight: 700; flex: 1;">{{ srv.name }}</h3>\
          <span style="font-weight: 700; color: var(--sf-accent); font-size: 17px; white-space: nowrap;">{{ formatMoney(srv.price) }}</span>\
        </div>\
        <p style="color: var(--sf-text-muted); font-size: 13px; margin: 0 0 14px; flex: 1;">{{ srv.description || \'Giúp bạn thư giãn và làm mới bản thân.\' }}</p>\
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--sf-border); padding-top: 14px;">\
          <span style="display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--sf-text-muted);"><Clock :size="14" /> {{ srv.duration }} phút</span>\
          <router-link :to="\'/booking?service=\' + srv.id" class="btn btn--outline btn--sm" style="border-radius: 6px; font-size: 12px;">Đặt lịch</router-link>\
        </div>\
      </div>\
    </div>\
    <div v-if="staff.length" style="text-align: center;">\
      <h3 style="margin-bottom: 24px; font-size: 22px;">Đội Ngũ Chuyên Gia</h3>\
      <div style="display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;">\
        <div v-for="st in staff" :key="st.id" style="text-align: center; width: 140px;">\
          <img :src="st.avatar || \'https://placehold.co/120x120?text=\'+st.name" :alt="st.name" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid var(--sf-border);" />\
          <div style="font-weight: 600; font-size: 14px;">{{ st.name }}</div>\
        </div>\
      </div>\
    </div>\
    <div style="text-align: center; margin-top: 32px;">\
      <router-link to="/services" class="btn btn--outline" style="padding: 12px 32px; border-radius: 8px;">Xem bảng giá đầy đủ →</router-link>\
    </div>\
  </div>\
</div>'
  };

  // Shortcode registry
  window.__STOREFRONT_SHORTCODES__ = window.__STOREFRONT_SHORTCODES__ || {};
  window.__STOREFRONT_SHORTCODES__['salon-services'] = SalonServicesPreview;

  if (bridge) {
    bridge.registerPlugin('salon', {
      routes: [
        { path: '/services', name: 'salon-services', component: SalonServices },
        { path: '/booking', name: 'salon-booking', component: SalonBooking }
      ],
      homeSections: [
        { type: 'salon_services', component: SalonServicesPreview, order: 1 }
      ]
    });
  }

})(window.Vue, window.LucideVueNext);
