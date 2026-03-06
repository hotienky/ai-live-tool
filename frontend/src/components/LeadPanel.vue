<template>
  <div class="lead-panel">
    <!-- Panel Header -->
    <div class="lead-panel__header">
      <h2 class="lead-panel__title">
        💰 Khách hàng tiềm năng
        <span class="lead-panel__count" v-if="filteredLeads.length">
          {{ filteredLeads.length }}
        </span>
      </h2>

      <!-- Search Bar -->
      <div class="lead-panel__search">
        <span class="lead-panel__search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm tên, username, nội dung..."
          class="lead-panel__search-input"
        />
        <button
          v-if="searchQuery"
          class="lead-panel__search-clear"
          @click="searchQuery = ''"
        >✕</button>
      </div>

      <!-- Filter Tabs -->
      <div class="lead-panel__filters">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="lead-panel__tab"
          :class="{ 'lead-panel__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- Dynamic Keyword Tags -->
      <div class="lead-panel__tags" v-if="dynamicKeywords.length > 0">
        <span class="lead-panel__tags-label">🏷️</span>
        <button
          v-for="kw in dynamicKeywords.slice(0, 15)"
          :key="kw"
          class="lead-panel__tag"
          :class="{ 'lead-panel__tag--active': activeKeyword === kw }"
          @click="toggleKeyword(kw)"
        >
          {{ kw }}
        </button>
        <button
          v-if="activeKeyword"
          class="lead-panel__tag lead-panel__tag--clear"
          @click="activeKeyword = ''"
        >
          ✕ Bỏ lọc
        </button>
      </div>
    </div>

    <!-- Leads List -->
    <div class="lead-panel__list" ref="listRef">
      <div v-if="filteredLeads.length === 0" class="lead-panel__empty">
        <div class="lead-panel__empty-icon">📡</div>
        <p v-if="searchQuery || activeKeyword">Không tìm thấy kết quả</p>
        <p v-else>Đang lắng nghe bình luận...</p>
        <p class="lead-panel__empty-sub">
          <template v-if="searchQuery || activeKeyword">
            Thử từ khóa khác hoặc <a href="#" @click.prevent="clearAllFilters">xóa bộ lọc</a>
          </template>
          <template v-else>
            Các khách hàng tiềm năng sẽ hiện ở đây
          </template>
        </p>
      </div>
      <LeadCard
        v-for="lead in filteredLeads"
        :key="lead.id"
        v-bind="lead"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LeadCard from './LeadCard.vue'

const props = defineProps({
  leads: {
    type: Array,
    default: () => [],
  },
})

const activeTab = ref('all')
const searchQuery = ref('')
const activeKeyword = ref('')
const listRef = ref(null)

const tabs = [
  { key: 'all', label: 'Tất cả', icon: '📋' },
  { key: '[HOT]', label: 'HOT', icon: '🔥' },
  { key: '[WARM]', label: 'WARM', icon: '🟠' },
]

// ── Vietnamese stop words to exclude ──
const STOP_WORDS = new Set([
  'của', 'và', 'là', 'có', 'cho', 'với', 'được', 'các', 'từ', 'trong',
  'này', 'đó', 'những', 'một', 'không', 'cũng', 'như', 'thì', 'mà',
  'khi', 'ở', 'đã', 'sẽ', 'đang', 'bị', 'vì', 'nên', 'hay', 'hoặc',
  'nhưng', 'nếu', 'vậy', 'rồi', 'lại', 'còn', 'em', 'anh', 'chị',
  'mình', 'ơi', 'nhé', 'nha', 'ạ', 'vậy', 'thế', 'quá', 'rất',
  'lắm', 'gì', 'nào', 'đâu', 'sao', 'bao', 'mấy', 'tôi', 'bạn',
  'bé', 'con', 'cái', 'đi', 'về', 'ra', 'vào', 'lên', 'xuống',
  'hỏi', 'xin', 'dạ', 'vâng', 'ok', 'ko', 'k', 'dc', 'đc', 'mn',
  'ah', 'à', 'uh', 'hả', 'hen', 'the', 'and', 'a', 'an', 'of', 'to',
  'in', 'is', 'it', 'for', 'on', 'with', 'at', 'by', 'be', 'this',
])

/**
 * Extract meaningful keywords/phrases from a comment
 */
function extractKeywords(text) {
  if (!text || text.length < 4) return []
  const cleaned = text.toLowerCase()
    .replace(/[.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleaned.split(' ').filter(w => w.length >= 2 && !STOP_WORDS.has(w))
  const keywords = new Set()

  // Single meaningful words (3+ chars, not number-only)
  for (const w of words) {
    if (w.length >= 3 && !/^\d+$/.test(w)) {
      keywords.add(w)
    }
  }

  // Bigrams (2-word phrases)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`
    if (bigram.length >= 5) {
      keywords.add(bigram)
    }
  }

  // Trigrams (3-word phrases) for specific patterns
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
    if (trigram.length >= 8) {
      keywords.add(trigram)
    }
  }

  return [...keywords]
}

/**
 * Dynamic keywords extracted from all current leads
 * Sorted by frequency (most common first)
 */
const dynamicKeywords = computed(() => {
  const freq = {}

  for (const lead of props.leads) {
    const kws = extractKeywords(lead.comment)
    for (const kw of kws) {
      freq[kw] = (freq[kw] || 0) + 1
    }
  }

  // Sort by frequency, then filter to show only phrases appearing 1+ times
  // Prioritize multi-word phrases
  return Object.entries(freq)
    .sort((a, b) => {
      // Multi-word phrases score higher
      const aWords = a[0].split(' ').length
      const bWords = b[0].split(' ').length
      if (bWords !== aWords) return bWords - aWords
      return b[1] - a[1]
    })
    .map(([kw]) => kw)
})

/**
 * Filtered leads based on tab + search + keyword
 */
const filteredLeads = computed(() => {
  let results = props.leads

  // Filter by tab (HOT/WARM)
  if (activeTab.value !== 'all') {
    results = results.filter(l => l.label === activeTab.value)
  }

  // Filter by search query (name, username, comment)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    results = results.filter(l =>
      (l.nickname && l.nickname.toLowerCase().includes(q)) ||
      (l.uniqueId && l.uniqueId.toLowerCase().includes(q)) ||
      (l.comment && l.comment.toLowerCase().includes(q))
    )
  }

  // Filter by active keyword tag
  if (activeKeyword.value) {
    const kw = activeKeyword.value.toLowerCase()
    results = results.filter(l =>
      l.comment && l.comment.toLowerCase().includes(kw)
    )
  }

  return results
})

function toggleKeyword(kw) {
  activeKeyword.value = activeKeyword.value === kw ? '' : kw
}

function clearAllFilters() {
  searchQuery.value = ''
  activeKeyword.value = ''
  activeTab.value = 'all'
}
</script>

<style scoped>
.lead-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.lead-panel__header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.lead-panel__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lead-panel__count {
  background: var(--color-accent-hot);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

/* ── Search Bar ─────────────────────────────── */
.lead-panel__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  margin-bottom: 10px;
  transition: border-color 0.2s;
}

.lead-panel__search:focus-within {
  border-color: var(--color-accent-warm);
}

.lead-panel__search-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.lead-panel__search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
}

.lead-panel__search-input::placeholder {
  color: var(--color-text-muted);
}

.lead-panel__search-clear {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  line-height: 1;
}

.lead-panel__search-clear:hover {
  color: var(--color-text-primary);
}

/* ── Tabs ────────────────────────────────────── */
.lead-panel__filters {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.lead-panel__tab {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.lead-panel__tab:hover {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.lead-panel__tab--active {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border-color: var(--color-accent-hot);
}

/* ── Dynamic Keyword Tags ────────────────────── */
.lead-panel__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  max-height: 60px;
  overflow-y: auto;
}

.lead-panel__tags-label {
  font-size: 13px;
  flex-shrink: 0;
}

.lead-panel__tag {
  padding: 3px 10px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.lead-panel__tag:hover {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border-color: var(--color-accent-warm);
}

.lead-panel__tag--active {
  background: var(--color-accent-warm);
  color: white;
  border-color: var(--color-accent-warm);
}

.lead-panel__tag--clear {
  background: transparent;
  color: var(--color-accent-hot);
  border-color: var(--color-accent-hot);
  font-weight: 600;
}

/* ── List ────────────────────────────────────── */
.lead-panel__list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.lead-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--color-text-muted);
  text-align: center;
}

.lead-panel__empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: dotPulse 2s ease-in-out infinite;
}

.lead-panel__empty-sub {
  font-size: 13px;
  margin-top: 4px;
  color: var(--color-text-muted);
}

.lead-panel__empty-sub a {
  color: var(--color-accent-warm);
  text-decoration: underline;
  cursor: pointer;
}
</style>
