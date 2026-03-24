/**
 * Restaurant Plugin — Storefront UI
 */
(function(Vue, Lucide) {
  'use strict';
  var bridge = window.__SF_BRIDGE__;
  var Users = Lucide.Users;
  var Calendar = Lucide.Calendar;
  var Clock = Lucide.Clock;
  var CheckCircle = Lucide.CheckCircle;

  var RestaurantReservation = {
    name: 'RestaurantReservation',
    components: { Users: Users, Calendar: Calendar, Clock: Clock, CheckCircle: CheckCircle },
    setup: function() {
      // Default info
      var state = Vue.reactive({
        form: { 
          customer_name: '', 
          customer_phone: '', 
          reservation_date: '', 
          time_slot: '', 
          party_size: 2, 
          notes: '' 
        },
        submitting: false,
        success: false
      });
      
      // Simple time slots for demo
      var timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

      async function submit() {
        state.submitting = true;
        try {
          await bridge.apiFetch('/restaurant/reservations', {
            method: 'POST',
            body: JSON.stringify(state.form)
          });
          state.success = true;
        } catch(e) {
          alert('Có lỗi xảy ra khi đặt bàn. Vui lòng thử lại sau.');
        }
        state.submitting = false;
      }

      return { state: state, timeSlots: timeSlots, submit: submit };
    },
    template: '\
<div class="sf-restaurant-reservation container section" style="padding: 40px 0; max-width: 700px; min-height: 60vh;">\
  <div v-if="state.success" style="text-align: center; padding: 60px 40px; background: var(--sf-bg-surface); border-radius: 16px; border: 1px solid var(--sf-border); box-shadow: 0 10px 30px rgba(0,0,0,0.05);">\
    <CheckCircle :size="80" style="color: #10b981; margin: 0 auto 24px;" />\
    <h2 style="font-size: 28px; margin: 0 0 16px;">Đặt bàn thành công!</h2>\
    <p style="color: var(--sf-text-muted); font-size: 16px; margin-bottom: 32px; line-height: 1.6;">Cảm ơn bạn đã đặt bàn tại nhà hàng chúng tôi. Nhân viên sẽ liên hệ lại qua số điện thoại để xác nhận sớm nhất.</p>\
    <router-link to="/" class="btn btn--primary" style="padding: 12px 32px; font-size: 16px;">Trở về trang chủ</router-link>\
  </div>\
  <div v-else style="background: var(--sf-bg-surface); border: 1px solid var(--sf-border); border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">\
    <div style="text-align: center; margin-bottom: 32px;">\
      <h1 style="margin: 0 0 12px; font-size: 28px;">Đặt Bàn Ngay</h1>\
      <p style="color: var(--sf-text-muted); margin: 0;">Vui lòng điền thông tin bên dưới để giữ chỗ.</p>\
    </div>\
    <form @submit.prevent="submit" style="display: flex; flex-direction: column; gap: 24px;">\
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">\
        <div style="flex: 1; min-width: 250px;">\
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Họ và tên *</label>\
          <input v-model="state.form.customer_name" type="text" class="sf-input" placeholder="Nguyễn Văn A" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 14px; font-size: 15px;" required />\
        </div>\
        <div style="flex: 1; min-width: 250px;">\
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Số điện thoại *</label>\
          <input v-model="state.form.customer_phone" type="tel" class="sf-input" placeholder="0909..." style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 14px; font-size: 15px;" required />\
        </div>\
      </div>\
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">\
        <div style="flex: 1; min-width: 150px;">\
          <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500;"><Calendar :size="16" /> Ngày đến *</label>\
          <input v-model="state.form.reservation_date" type="date" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 14px; font-size: 15px;" required />\
        </div>\
        <div style="flex: 1; min-width: 150px;">\
          <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500;"><Clock :size="16" /> Giờ đến *</label>\
          <select v-model="state.form.time_slot" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 14px; font-size: 15px;" required>\
            <option value="">-- Chọn giờ --</option>\
            <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>\
          </select>\
        </div>\
        <div style="flex: 1; min-width: 150px;">\
          <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500;"><Users :size="16" /> Số người *</label>\
          <input v-model="state.form.party_size" type="number" min="1" max="50" class="sf-input" style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 14px; font-size: 15px;" required />\
        </div>\
      </div>\
      <div>\
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Ghi chú (Tùy chọn)</label>\
        <textarea v-model="state.form.notes" rows="4" class="sf-input" placeholder="Yêu cầu ghế trẻ em, trang trí sinh nhật..." style="width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; padding: 14px; font-size: 15px; resize: vertical;"></textarea>\
      </div>\
      <button type="submit" class="btn btn--primary" style="padding: 16px; font-size: 18px; border-radius: 8px; font-weight: 600; margin-top: 10px; transition: background-color 0.2s;" :disabled="state.submitting">\
        {{ state.submitting ? \'Đang xử lý...\' : \'Xác nhận Đặt bàn\' }}\
      </button>\
    </form>\
  </div>\
</div>'
  };

  var RestaurantMenu = {
    name: 'RestaurantMenu',
    props: {
      title: { type: String, default: 'Thực Đơn Nhà Hàng' },
      subtitle: { type: String, default: 'Khám phá hương vị tinh tế từ các nguyên liệu tươi ngon nhất, được chuẩn bị bởi đội ngũ đầu bếp đam mê nghệ thuật ẩm thực.' }
    },
    setup: function() {
      var categories = Vue.ref([]);
      var activeCategoryId = Vue.ref(null);
      var loading = Vue.ref(true);

      Vue.onMounted(async function() {
        try {
          var res = await bridge.apiFetch('/restaurant/menu');
          if (res && res.length > 0) {
            categories.value = res;
            activeCategoryId.value = res[0].id;
          }
        } catch(e) {
          console.error(e);
        }
        loading.value = false;
      });

      var activeCategory = Vue.computed(function() {
        return categories.value.find(c => c.id === activeCategoryId.value) || null;
      });

      return { categories: categories, activeCategoryId: activeCategoryId, activeCategory: activeCategory, loading: loading };
    },
    template: '\
<div class="sf-restaurant-menu container section" style="padding: 60px 0; min-height: 60vh;">\
  <div style="text-align: center; margin-bottom: 48px;">\
    <h1 style="font-size: 36px; font-weight: 800; margin: 0 0 16px;">{{ title }}</h1>\
    <p style="color: var(--sf-text-muted); font-size: 18px; max-width: 600px; margin: 0 auto;">{{ subtitle }}</p>\
  </div>\
  <div v-if="loading" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Đang tải thực đơn...</div>\
  <div v-else-if="categories.length === 0" style="text-align: center; padding: 40px; color: var(--sf-text-muted);">Thực đơn đang được cập nhật.</div>\
  <div v-else>\
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 40px; flex-wrap: wrap;">\
      <button v-for="cat in categories" :key="cat.id" @click="activeCategoryId = cat.id" :style="{ padding: \'10px 24px\', borderRadius: \'30px\', border: \'none\', cursor: \'pointer\', fontSize: \'16px\', fontWeight: \'600\', transition: \'all 0.3s\', background: activeCategoryId === cat.id ? \'var(--sf-accent)\' : \'var(--sf-bg-surface)\', color: activeCategoryId === cat.id ? \'#fff\' : \'var(--sf-text-secondary)\', boxShadow: activeCategoryId === cat.id ? \'var(--sf-shadow-md)\' : \'0 2px 8px rgba(0,0,0,0.05)\' }">\
        {{ cat.name }}\
      </button>\
    </div>\
    <div v-if="activeCategory" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">\
      <div v-for="item in activeCategory.items" :key="item.id" class="menu-item-card" style="display: flex; gap: 16px; background: var(--sf-bg-surface); padding: 20px; border-radius: 16px; border: 1px solid var(--sf-border); transition: transform 0.3s, box-shadow 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.03);" onmouseover="this.style.transform=\'translateY(-4px)\'; this.style.boxShadow=\'0 12px 24px rgba(0,0,0,0.08)\'" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'0 4px 15px rgba(0,0,0,0.03)\'">\
        <img v-if="item.image" :src="item.image" :alt="item.name" style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px; flex-shrink: 0;" />\
        <div style="width: 100px; height: 100px; background: var(--sf-accent-glow); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--sf-accent); flex-shrink: 0;" v-else>\
          <span>No IMG</span>\
        </div>\
        <div style="flex: 1; display: flex; flex-direction: column;">\
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">\
            <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700;">{{ item.name }}</h3>\
            <div style="font-weight: 800; color: var(--sf-accent); font-size: 16px; white-space: nowrap;">{{ new Intl.NumberFormat("vi-VN").format(item.price) }}đ</div>\
          </div>\
          <p v-if="item.description" style="color: var(--sf-text-muted); font-size: 14px; margin: 0 0 12px; line-height: 1.5; flex: 1;">{{ item.description }}</p>\
        </div>\
      </div>\
    </div>\
  </div>\
</div>'
  };

  // Shortcode registry for Visual Builder
  window.__STOREFRONT_SHORTCODES__ = window.__STOREFRONT_SHORTCODES__ || {};
  window.__STOREFRONT_SHORTCODES__['restaurant-menu'] = RestaurantMenu;

  if (bridge) {
    bridge.registerPlugin('restaurant', {
      routes: [
        { path: '/menu', name: 'restaurant-menu', component: RestaurantMenu },
        { path: '/reservations', name: 'restaurant-reservation', component: RestaurantReservation }
      ]
    });
  }

})(window.Vue, window.LucideVueNext);
