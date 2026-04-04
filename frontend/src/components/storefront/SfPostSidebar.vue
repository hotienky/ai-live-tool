<template>
  <aside class="sf-sidebar">
    <!-- Search -->
    <div class="sf-sidebar__card">
      <h4 class="sf-sidebar__title">{{ t('storefront.msg_search', 'Tìm kiếm') }}</h4>
      <div class="sf-sidebar__search">
        <Search :size="14" class="sf-sidebar__search-icon" />
        <input v-model="searchQuery" type="text" :placeholder="t('storefront.msg_search_posts', 'Tìm bài viết...')" class="sf-sidebar__search-input" @keydown.enter="$emit('search', searchQuery)" />
      </div>
    </div>

    <!-- Categories -->
    <div class="sf-sidebar__card" v-if="categories.length">
      <h4 class="sf-sidebar__title">
        <FolderOpen :size="15" /> {{ t('storefront.msg_categories', 'Danh mục') }}
      </h4>
      <ul class="sf-sidebar__list">
        <li v-for="cat in categories" :key="cat" @click="$emit('filterCategory', cat)" class="sf-sidebar__list-item">
          <span>{{ cat }}</span>
          <ChevronRight :size="14" />
        </li>
      </ul>
    </div>

    <!-- Recent Posts -->
    <div class="sf-sidebar__card" v-if="recentPosts.length">
      <h4 class="sf-sidebar__title">
        <Clock :size="15" /> {{ t('storefront.msg_recent_posts', 'Bài viết gần đây') }}
      </h4>
      <div class="sf-sidebar__recent">
        <div v-for="post in recentPosts.slice(0, 5)" :key="post.id" class="sf-sidebar__recent-item" @click="$emit('viewPost', post.slug)">
          <img v-if="post.featured_image" :src="post.featured_image" :alt="post.title" class="sf-sidebar__recent-img" loading="lazy" />
          <div v-else class="sf-sidebar__recent-img sf-sidebar__recent-img--placeholder">
            <FileText :size="16" />
          </div>
          <div class="sf-sidebar__recent-info">
            <h5>{{ post.title }}</h5>
            <time>{{ formatDate(post.published_at) }}</time>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags Cloud -->
    <div class="sf-sidebar__card" v-if="tags.length">
      <h4 class="sf-sidebar__title">
        <Tag :size="15" /> {{ t('storefront.msg_tags', 'Thẻ') }}
      </h4>
      <div class="sf-sidebar__tags">
        <span v-for="tag in tags" :key="tag" class="sf-sidebar__tag" @click="$emit('filterTag', tag)">
          #{{ tag }}
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { Search, FolderOpen, Clock, Tag, FileText, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  categories: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
  recentPosts: { type: Array, default: () => [] },
})
defineEmits(['viewPost', 'filterCategory', 'filterTag', 'search'])

const searchQuery = ref('')

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })
}
</script>

<style scoped>
.sf-sidebar { display: flex; flex-direction: column; gap: 20px; }

.sf-sidebar__card {
  padding: 20px;
  border-radius: 16px;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.08));
}

.sf-sidebar__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--color-text-primary);
  margin: 0 0 16px; padding-bottom: 12px;
  border-bottom: 2px solid var(--color-accent-primary, #7c3aed);
}

/* Search */
.sf-sidebar__search {
  position: relative;
}
.sf-sidebar__search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--color-text-muted);
}
.sf-sidebar__search-input {
  width: 100%; padding: 10px 12px 10px 34px; border-radius: 10px;
  border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  background: var(--color-bg-secondary, #f9fafb);
  font-size: 13px; color: var(--color-text-primary);
}
.sf-sidebar__search-input:focus {
  border-color: var(--color-accent-primary, #7c3aed); outline: none;
}

/* Category List */
.sf-sidebar__list { list-style: none; padding: 0; margin: 0; }
.sf-sidebar__list-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-radius: 8px; font-size: 14px;
  color: var(--color-text-secondary, #4b5563);
  cursor: pointer; transition: all 0.2s;
}
.sf-sidebar__list-item:hover {
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-accent-primary, #7c3aed);
}
.sf-sidebar__list-item svg { opacity: 0; transition: opacity 0.2s; }
.sf-sidebar__list-item:hover svg { opacity: 1; }

/* Recent Posts */
.sf-sidebar__recent { display: flex; flex-direction: column; gap: 12px; }
.sf-sidebar__recent-item {
  display: flex; gap: 12px; cursor: pointer;
  padding: 8px; border-radius: 10px; transition: background 0.2s;
}
.sf-sidebar__recent-item:hover { background: var(--color-bg-secondary, #f3f4f6); }
.sf-sidebar__recent-img {
  width: 60px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
}
.sf-sidebar__recent-img--placeholder {
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-tertiary, #e5e7eb);
  color: var(--color-text-muted);
}
.sf-sidebar__recent-info { flex: 1; min-width: 0; }
.sf-sidebar__recent-info h5 {
  font-size: 13px; font-weight: 600; margin: 0 0 4px;
  color: var(--color-text-primary);
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;
}
.sf-sidebar__recent-info time {
  font-size: 11px; color: var(--color-text-muted);
}

/* Tags Cloud */
.sf-sidebar__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.sf-sidebar__tag {
  padding: 5px 12px; border-radius: 16px; font-size: 12px; font-weight: 500;
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-secondary, #6b7280);
  cursor: pointer; transition: all 0.2s;
}
.sf-sidebar__tag:hover {
  background: var(--color-accent-primary, #7c3aed); color: #fff;
}

@media (max-width: 768px) {
  .sf-sidebar__card { padding: 16px; }
}
</style>
