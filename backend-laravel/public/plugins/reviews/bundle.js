/**
 * Reviews Plugin — Review Manager with Approval Workflow
 */
var Plugin_reviews = (function(e, k) {
  'use strict';

  var bridge = window.__APP_BRIDGE__;
  var hooks = (bridge && bridge.hooks) || window.__APP_HOOKS__;
  var apiFetch = bridge ? bridge.apiFetch : function(url, opts) {
    return fetch('/api' + url, Object.assign({ headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } }, opts));
  };
  var t = (bridge && bridge.t) || function(k, d) { return d; };
  var showToast = (bridge && bridge.showToast) || function() {};

  var ReviewManager = {
    name: 'ReviewManager',
    emits: ['navigate'],
    setup: function() {
      var reviews = e.ref([]);
      var stats = e.ref({ total: 0, pending: 0, approved: 0, avg_rating: 0 });
      var loading = e.ref(true);
      var filter = e.ref('all'); // all, pending, approved

      e.onMounted(function() { loadReviews(); loadStats(); });

      async function loadReviews() {
        loading.value = true;
        try {
          var url = '/reviews';
          if (filter.value === 'pending') url += '?approved=0';
          else if (filter.value === 'approved') url += '?approved=1';
          var res = await apiFetch(url);
          var data = await res.json();
          reviews.value = data.data || data || [];
        } catch(err) { reviews.value = []; }
        loading.value = false;
      }

      async function loadStats() {
        try {
          var res = await apiFetch('/reviews/stats');
          stats.value = await res.json();
        } catch(err) {}
      }

      async function toggleApprove(review) {
        try {
          var res = await apiFetch('/reviews/' + review.id + '/approve', { method: 'PUT' });
          var data = await res.json();
          review.is_approved = data.is_approved;
          showToast(review.is_approved ? 'Đã duyệt' : 'Đã ẩn', 'success');
          loadStats();
        } catch(err) { showToast('Lỗi', 'error'); }
      }

      async function deleteReview(id) {
        if (!confirm('Xóa đánh giá này?')) return;
        try {
          await apiFetch('/reviews/' + id, { method: 'DELETE' });
          reviews.value = reviews.value.filter(function(r) { return r.id !== id; });
          showToast('Đã xóa', 'success');
          loadStats();
        } catch(err) { showToast('Lỗi', 'error'); }
      }

      function renderStars(n) {
        return '★'.repeat(n) + '☆'.repeat(5 - n);
      }

      function formatDate(d) {
        return d ? new Date(d).toLocaleDateString('vi-VN') : '-';
      }

      e.watch(filter, loadReviews);

      return { reviews, stats, loading, filter, toggleApprove, deleteReview, renderStars, formatDate };
    },
    template: '\
<div class="rv">\
  <div class="rv-header">\
    <h3>⭐ Đánh giá & Nhận xét</h3>\
  </div>\
  <div class="rv-stats">\
    <div class="rv-stat"><span class="rv-stat-num">{{ stats.total }}</span><span class="rv-stat-label">Tổng</span></div>\
    <div class="rv-stat rv-stat--pending"><span class="rv-stat-num">{{ stats.pending }}</span><span class="rv-stat-label">Chờ duyệt</span></div>\
    <div class="rv-stat rv-stat--approved"><span class="rv-stat-num">{{ stats.approved }}</span><span class="rv-stat-label">Đã duyệt</span></div>\
    <div class="rv-stat rv-stat--rating"><span class="rv-stat-num">{{ stats.avg_rating }}/5</span><span class="rv-stat-label">Trung bình</span></div>\
  </div>\
  <div class="rv-filters">\
    <button :class="{\'rv-filter--active\': filter===\'all\'}" @click="filter=\'all\'">Tất cả</button>\
    <button :class="{\'rv-filter--active\': filter===\'pending\'}" @click="filter=\'pending\'">⏳ Chờ duyệt</button>\
    <button :class="{\'rv-filter--active\': filter===\'approved\'}" @click="filter=\'approved\'">✅ Đã duyệt</button>\
  </div>\
  <div v-if="loading" class="rv-loading">Đang tải...</div>\
  <div v-else-if="!reviews.length" class="rv-empty">Chưa có đánh giá nào</div>\
  <div v-else class="rv-list">\
    <div v-for="r in reviews" :key="r.id" class="rv-card" :class="{\'rv-card--pending\': !r.is_approved}">\
      <div class="rv-card-top">\
        <div class="rv-avatar">{{ r.author_name ? r.author_name[0].toUpperCase() : "?" }}</div>\
        <div class="rv-info">\
          <strong>{{ r.author_name }}</strong>\
          <div class="rv-stars">{{ renderStars(r.rating) }}</div>\
        </div>\
        <span class="rv-date">{{ formatDate(r.created_at) }}</span>\
      </div>\
      <p class="rv-content">{{ r.content || "(Không có nội dung)" }}</p>\
      <div class="rv-card-actions">\
        <button @click="toggleApprove(r)">{{ r.is_approved ? "⏸ Ẩn" : "✅ Duyệt" }}</button>\
        <button class="rv-del" @click="deleteReview(r.id)">🗑 Xóa</button>\
      </div>\
    </div>\
  </div>\
</div>'
  };

  // ── Register hooks ──
  if (hooks) {
    hooks.addFilter('sidebar_items', function(items) {
      items.push({ key: 'shop/reviews', label: t('reviews.title', 'Đánh giá'), icon: 'Star', featureGroup: 'store', moduleId: 'reviews' });
      return items;
    });
    hooks.addFilter('admin_routes', function(config) {
      Object.assign(config.routeToTab, { 'shop/reviews': 'reviews' });
      return config;
    });
  }

  var plugin = {
    id: 'reviews',
    name: 'Đánh giá & Nhận xét',
    version: '1.0.0',
    components: { 'reviews': e.markRaw(ReviewManager) },
    sidebar: { group: 'Cửa hàng', items: [{ key: 'reviews', label: 'Đánh giá', icon: 'Star', route: 'shop/reviews' }] }
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__['reviews'] = plugin;
  return plugin;
})(Vue, LucideVueNext);
