<template>
  <div class="lead-panel">
    <!-- Panel Header -->
    <div class="lead-panel__header">
      <h2 class="lead-panel__title">
        <DollarSign :size="20" class="lead-panel__title-icon" />
        Khách hàng tiềm năng
        <span class="lead-panel__count" v-if="filteredLeads.length">
          {{ filteredLeads.length }}
        </span>
      </h2>

      <!-- Search Bar -->
      <div class="lead-panel__search">
        <Search :size="14" class="lead-panel__search-icon" />
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
        >
          <X :size="14" />
        </button>
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
          <component :is="tab.icon" :size="13" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Dynamic Keyword Tags -->
      <div class="lead-panel__tags" v-if="dynamicKeywords.length > 0">
        <Tag :size="13" class="lead-panel__tags-label" />
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
          <X :size="10" /> Bỏ lọc
        </button>
      </div>
    </div>

    <!-- Leads List -->
    <div class="lead-panel__list" ref="listRef">
      <div v-if="filteredLeads.length === 0" class="lead-panel__empty">
        <div class="lead-panel__empty-icon">
          <RadioTower :size="48" />
        </div>
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
        @openCustomer="$emit('openCustomer', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import LeadCard from './LeadCard.vue'
import { Search, X, Tag, RadioTower, DollarSign, List, Flame, CircleDot } from 'lucide-vue-next'

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
  { key: 'all', label: 'Tất cả', icon: List },
  { key: '[HOT]', label: 'HOT', icon: Flame },
  { key: '[WARM]', label: 'WARM', icon: CircleDot },
]

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

function extractKeywords(text) {
  if (!text || text.length < 4) return []
  const cleaned = text.toLowerCase()
    .replace(/[.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleaned.split(' ').filter(w => w.length >= 2 && !STOP_WORDS.has(w))
  const keywords = new Set()

  for (const w of words) {
    if (w.length >= 3 && !/^\d+$/.test(w)) keywords.add(w)
  }
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`
    if (bigram.length >= 5) keywords.add(bigram)
  }
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
    if (trigram.length >= 8) keywords.add(trigram)
  }
  return [...keywords]
}

const dynamicKeywords = computed(() => {
  const freq = {}
  for (const lead of props.leads) {
    for (const kw of extractKeywords(lead.comment)) {
      freq[kw] = (freq[kw] || 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a, b) => {
      const aWords = a[0].split(' ').length, bWords = b[0].split(' ').length
      if (bWords !== aWords) return bWords - aWords
      return b[1] - a[1]
    })
    .map(([kw]) => kw)
})

const filteredLeads = computed(() => {
  let results = props.leads
  if (activeTab.value !== 'all') results = results.filter(l => l.label === activeTab.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    results = results.filter(l =>
      (l.nickname && l.nickname.toLowerCase().includes(q)) ||
      (l.uniqueId && l.uniqueId.toLowerCase().includes(q)) ||
      (l.comment && l.comment.toLowerCase().includes(q))
    )
  }
  if (activeKeyword.value) {
    const kw = activeKeyword.value.toLowerCase()
    results = results.filter(l => l.comment && l.comment.toLowerCase().includes(kw))
  }
  return results
})

function toggleKeyword(kw) { activeKeyword.value = activeKeyword.value === kw ? '' : kw }
function clearAllFilters() { searchQuery.value = ''; activeKeyword.value = ''; activeTab.value = 'all' }
</script>

<style scoped>
.lead-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.lead-panel__header { padding: 16px 20px 12px; border-bottom: 1px solid var(--color-border); flex-shrink: 0; }
.lead-panel__title {
  font-size: 18px; font-weight: 700; margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.lead-panel__title-icon { color: var(--color-accent-warm); }
.lead-panel__count {
  background: var(--color-accent-hot); color: white;
  font-size: 12px; padding: 2px 8px; border-radius: 12px; font-weight: 600;
}

.lead-panel__search {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); margin-bottom: 10px; transition: border-color 0.2s;
}
.lead-panel__search:focus-within { border-color: var(--color-accent-warm); }
.lead-panel__search-icon { color: var(--color-text-muted); flex-shrink: 0; }
.lead-panel__search-input {
  flex: 1; border: none; background: transparent;
  color: var(--color-text-primary); font-size: 13px; outline: none;
}
.lead-panel__search-input::placeholder { color: var(--color-text-muted); }
.lead-panel__search-clear {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 0 4px; display: flex; align-items: center;
}
.lead-panel__search-clear:hover { color: var(--color-text-primary); }

.lead-panel__filters { display: flex; gap: 6px; margin-bottom: 8px; }
.lead-panel__tab {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--color-border);
  background: transparent; color: var(--color-text-secondary);
  font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.lead-panel__tab:hover { background: var(--color-bg-card); color: var(--color-text-primary); }
.lead-panel__tab--active { background: var(--color-bg-card); color: var(--color-text-primary); border-color: var(--color-accent-hot); }

.lead-panel__tags {
  display: flex; flex-wrap: wrap; gap: 5px; align-items: center;
  max-height: 60px; overflow-y: auto;
}
.lead-panel__tags-label { color: var(--color-text-muted); flex-shrink: 0; }
.lead-panel__tag {
  display: flex; align-items: center; gap: 3px;
  padding: 3px 10px; border-radius: 14px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-secondary);
  font-size: 11px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.lead-panel__tag:hover { background: var(--color-bg-card); color: var(--color-text-primary); border-color: var(--color-accent-warm); }
.lead-panel__tag--active { background: var(--color-accent-warm); color: white; border-color: var(--color-accent-warm); }
.lead-panel__tag--clear { background: transparent; color: var(--color-accent-hot); border-color: var(--color-accent-hot); font-weight: 600; }

.lead-panel__list { flex: 1; overflow-y: auto; padding: 12px 16px; }
.lead-panel__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 300px; color: var(--color-text-muted); text-align: center;
}
.lead-panel__empty-icon { margin-bottom: 16px; animation: dotPulse 2s ease-in-out infinite; color: var(--color-text-muted); }
.lead-panel__empty-sub { font-size: 13px; margin-top: 4px; color: var(--color-text-muted); }
.lead-panel__empty-sub a { color: var(--color-accent-warm); text-decoration: underline; cursor: pointer; }
</style>
