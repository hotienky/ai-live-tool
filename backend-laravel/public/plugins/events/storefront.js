/**
 * Events Plugin — Storefront UI
 */
(function(Vue, Lucide) {
  'use strict';
  var bridge = window.__SF_BRIDGE__;
  var Calendar = Lucide.Calendar;
  var MapPin = Lucide.MapPin;
  var Clock = Lucide.Clock;

  function formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : ''; }
  function formatMoney(v) { return v ? Number(v).toLocaleString('vi-VN') + 'đ' : '0đ'; }

  var EventsList = {
    name: 'EventsList',
    components: { Calendar: Calendar, MapPin: MapPin, Clock: Clock },
    setup: function() {
      var events = Vue.ref([]);
      var loading = Vue.ref(true);

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/events');
          events.value = res.data || [];
        } catch(e) { console.error('Failed to fetch events'); }
        loading.value = false;
      });

      function parseMeta(meta) { try { return typeof meta === 'string' ? JSON.parse(meta) : meta; } catch(e) { return {}; } }

      return { events: events, loading: loading, parseMeta: parseMeta, formatDate: formatDate };
    },
    template: '\
<div class="sf-events-list container section" style="padding: 40px 0; min-height: 60vh;">\
  <h1 class="page-title" style="margin-bottom: 24px;">Các Sự Kiện Sắp Tới</h1>\
  <div v-if="loading" class="text-center">Đang tải sự kiện...</div>\
  <div v-else-if="events.length === 0" class="empty-state">Chưa có sự kiện nào.</div>\
  <div v-else class="events-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">\
    <router-link v-for="ev in events" :key="ev.id" :to="\'/events/\' + ev.id" class="event-card" style="border: 1px solid var(--sf-border); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; background: var(--sf-bg-card); transition: box-shadow 0.2s;">\
      <img :src="ev.featured_image || \'https://placehold.co/600x400?text=Event\'" :alt="ev.title" style="width: 100%; height: 200px; object-fit: cover;" />\
      <div style="padding: 20px;">\
        <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">{{ ev.title }}</h3>\
        <p style="color: var(--sf-text-muted); font-size: 14px; margin-bottom: 16px;">{{ ev.excerpt || ev.title }}</p>\
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--sf-text-muted);">\
          <div style="display: flex; align-items: center; gap: 6px;"><Calendar :size="16" /> {{ formatDate(parseMeta(ev.meta).start_date) }}</div>\
          <div style="display: flex; align-items: center; gap: 6px;"><MapPin :size="16" /> {{ parseMeta(ev.meta).location || "Chưa cập nhật địa điểm" }}</div>\
        </div>\
      </div>\
    </router-link>\
  </div>\
</div>'
  };

  var EventDetail = {
    name: 'EventDetail',
    components: { Calendar: Calendar, MapPin: MapPin, Clock: Clock },
    props: ['id'],
    setup: function(props) {
      var event = Vue.ref(null);
      var tickets = Vue.ref([]);
      var loading = Vue.ref(true);

      var state = Vue.reactive({
        form: { ticket_id: '', name: '', email: '', phone: '' },
        registering: false,
        registeredCode: null
      });

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/events/' + props.id);
          event.value = res.data || res;
          
          var tRes = await bridge.apiFetch('/events/' + props.id + '/tickets');
          tickets.value = tRes.data || Object.values(tRes) || [];
          if (tickets.value.length > 0) {
            state.form.ticket_id = tickets.value[0].id; // default select
          }
        } catch(e) {}
        loading.value = false;
      });

      async function submitRegister() {
        if (!state.form.name || !state.form.email) {
          alert("Vui lòng nhập tên và email"); return;
        }
        state.registering = true;
        try {
          var res = await bridge.apiFetch('/events/' + props.id + '/register', {
            method: 'POST',
            body: JSON.stringify({
              ticket_id: state.form.ticket_id,
              attendee_name: state.form.name,
              attendee_email: state.form.email,
              attendee_phone: state.form.phone,
            })
          });
          state.registeredCode = res.code || (res.data && res.data.registration_code) || 'SUCCESS';
          alert('Đăng ký vé thành công!');
        } catch(e) {
          alert('Đăng ký thất bại. Bạn bị giới hạn thao tác hoặc lỗi hệ thống.');
        }
        state.registering = false;
      }

      function parseMeta(meta) { try { return typeof meta === 'string' ? JSON.parse(meta) : meta; } catch(e) { return {}; } }

      return { event: event, tickets: tickets, loading: loading, state: state, submitRegister: submitRegister, parseMeta: parseMeta, formatDate: formatDate, formatMoney: formatMoney };
    },
    template: '\
<div class="sf-event-detail container section" style="padding: 40px 0;">\
  <div v-if="loading" class="text-center">Đang tải...</div>\
  <div v-else-if="!event">Sự kiện không tồn tại.</div>\
  <div v-else class="event-layout" style="display: flex; flex-wrap: wrap; gap: 40px;">\
    <div class="event-main" style="flex: 1; min-width: 300px;">\
      <img :src="event.featured_image || \'https://placehold.co/1200x500?text=Event\'" :alt="event.title" style="width: 100%; border-radius: 16px; margin-bottom: 24px; max-height: 400px; object-fit: cover;" />\
      <h1 style="margin-bottom: 16px;">{{ event.title }}</h1>\
      <div v-html="event.body" class="sf-html-content" style="line-height: 1.6; color: var(--sf-text-secondary);"></div>\
    </div>\
    <div class="event-sidebar" style="width: 350px; flex-shrink: 0;">\
      <div class="sidebar-box" style="background: var(--sf-bg-surface); border: 1px solid var(--sf-border); border-radius: 12px; padding: 24px; position: sticky; top: 100px;">\
        <h3 style="margin-top: 0; margin-bottom: 20px;">Thông tin tổ chức</h3>\
        <ul style="list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 16px; font-size: 14px;">\
          <li style="display: flex; gap: 12px; align-items: flex-start;"><Calendar style="color:var(--sf-accent);flex-shrink:0" /> <div><strong>Thời gian:</strong><br/>{{ formatDate(parseMeta(event.meta).start_date) }}</div></li>\
          <li style="display: flex; gap: 12px; align-items: flex-start;"><Clock style="color:var(--sf-accent);flex-shrink:0" /> <div><strong>Giờ bắt đầu:</strong><br/>{{ parseMeta(event.meta).start_date ? new Date(parseMeta(event.meta).start_date).toLocaleTimeString() : \'\' }}</div></li>\
          <li style="display: flex; gap: 12px; align-items: flex-start;"><MapPin style="color:var(--sf-accent);flex-shrink:0" /> <div><strong>Địa điểm:</strong><br/>{{ parseMeta(event.meta).location }}</div></li>\
        </ul>\
        \
        <hr style="border: 0; border-top: 1px solid var(--sf-border); margin: 24px 0;" />\
        \
        <h3 style="margin-bottom: 16px;">Đăng ký Tham gia</h3>\
        <div v-if="state.registeredCode" style="background: #ecfdf5; color: #065f46; padding: 16px; border-radius: 8px; text-align: center;">\
          <p style="margin: 0 0 8px;">Đăng ký thành công!</p>\
          <h2 style="margin: 0;">{{ state.registeredCode }}</h2>\
        </div>\
        <form v-else @submit.prevent="submitRegister" style="display: flex; flex-direction: column; gap: 16px;">\
          <div v-if="tickets.length > 0">\
            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Chọn vé</label>\
            <select v-model="state.form.ticket_id" class="sf-input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--sf-border);" required>\
              <option v-for="tk in tickets" :key="tk.id" :value="tk.id">{{ tk.name }} - {{ formatMoney(tk.price) }}</option>\
            </select>\
          </div>\
          <div>\
            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Họ tên *</label>\
            <input v-model="state.form.name" type="text" class="sf-input" required style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--sf-border);" />\
          </div>\
          <div>\
            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Email *</label>\
            <input v-model="state.form.email" type="email" class="sf-input" required style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--sf-border);" />\
          </div>\
          <div>\
            <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">Số điện thoại</label>\
            <input v-model="state.form.phone" type="text" class="sf-input" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--sf-border);" />\
          </div>\
          <button type="submit" class="btn btn--primary" style="width: 100%;" :disabled="state.registering">{{ state.registering ? \'Đang xử lý...\' : \'Đăng ký ngay\' }}</button>\
        </form>\
      </div>\
    </div>\
  </div>\
</div>'
  };

  // ── Homepage Preview Block ──
  var UpcomingEventsPreview = {
    name: 'UpcomingEventsPreview',
    props: {
      title: { type: String, default: 'Sự Kiện Sắp Tới' },
      subtitle: { type: String, default: 'Đừng bỏ lỡ những trải nghiệm tuyệt vời' },
      count: { type: [Number, String], default: 6 }
    },
    components: { Calendar: Calendar, MapPin: MapPin },
    setup: function(props) {
      var events = Vue.ref([]);
      var loading = Vue.ref(true);
      function parseMeta(meta) { try { return typeof meta === 'string' ? JSON.parse(meta) : meta; } catch(e) { return {}; } }
      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/events');
          events.value = (res.data || []).slice(0, Number(props.count) || 6);
        } catch(e) {}
        loading.value = false;
      });
      return { events: events, loading: loading, parseMeta: parseMeta, formatDate: formatDate };
    },
    template: '\
<div class="sf-events-preview container section" style="padding: 60px 0;">\
  <div style="text-align: center; margin-bottom: 40px;">\
    <h2 style="font-size: 32px; font-weight: 800; margin: 0 0 12px;">{{ title }}</h2>\
    <p style="color: var(--sf-text-muted); font-size: 16px; max-width: 500px; margin: 0 auto;">{{ subtitle }}</p>\
  </div>\
  <div v-if="loading" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Đang tải...</div>\
  <div v-else-if="events.length === 0" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Chưa có sự kiện.</div>\
  <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">\
    <router-link v-for="ev in events" :key="ev.id" :to="\'/events/\' + ev.id" style="border: 1px solid var(--sf-border); border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit; background: var(--sf-bg-card); transition: box-shadow 0.2s;">\
      <img :src="ev.featured_image || \'https://placehold.co/600x400?text=Event\'" :alt="ev.title" style="width: 100%; height: 200px; object-fit: cover;" />\
      <div style="padding: 20px;">\
        <h3 style="margin: 0 0 10px; font-size: 17px; font-weight: 700;">{{ ev.title }}</h3>\
        <p style="color: var(--sf-text-muted); font-size: 13px; margin: 0 0 14px; line-height: 1.5;">{{ ev.excerpt || \'\'  }}</p>\
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--sf-text-muted);">\
          <span style="display: flex; align-items: center; gap: 6px;"><Calendar :size="14" /> {{ formatDate(parseMeta(ev.meta).start_date) }}</span>\
          <span style="display: flex; align-items: center; gap: 6px;"><MapPin :size="14" /> {{ parseMeta(ev.meta).location || \'Chưa cập nhật\' }}</span>\
        </div>\
      </div>\
    </router-link>\
  </div>\
  <div style="text-align: center; margin-top: 32px;">\
    <router-link to="/events" class="btn btn--outline" style="padding: 12px 32px; border-radius: 8px;">Xem tất cả sự kiện →</router-link>\
  </div>\
</div>'
  };

  // Shortcode registry
  window.__STOREFRONT_SHORTCODES__ = window.__STOREFRONT_SHORTCODES__ || {};
  window.__STOREFRONT_SHORTCODES__['upcoming-events'] = UpcomingEventsPreview;

  if (bridge) {
    bridge.registerPlugin('events', {
      routes: [
        { path: '/events', name: 'events-list', component: EventsList },
        { path: '/events/:id', name: 'event-detail', component: EventDetail, props: true }
      ],
      homeSections: [
        { type: 'upcoming_events', component: UpcomingEventsPreview, order: 1 }
      ]
    });
  }

})(window.Vue, window.LucideVueNext);
