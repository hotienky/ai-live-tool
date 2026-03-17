<template>
  <div class="dashboard-chart card mb-8 p-5 md:p-6">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-base font-semibold mp-text-primary">Tỷ lệ Tenants</h2>
    </div>

    <!-- Stats Bar Wrapper -->
    <div class="chart-wrapper">
      <div 
        v-if="total > 0" 
        class="chart-track flex h-4 md:h-5 w-full rounded-full overflow-hidden transition-all duration-700 ease-out"
      >
        <!-- Active -->
        <div 
          class="bg-emerald-500 h-full transition-all duration-700 relative group cursor-pointer"
          :style="{ width: percent(active) + '%' }"
          v-if="active > 0"
        >
          <div class="tooltip hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 shadow-lg">
            Hoạt động: {{ active }} ({{ percent(active) }}%)
          </div>
        </div>

        <!-- Suspended -->
        <div 
          class="bg-red-500 h-full transition-all duration-700 relative group cursor-pointer"
          :style="{ width: percent(suspended) + '%' }"
          v-if="suspended > 0"
        >
          <div class="tooltip hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 shadow-lg">
            Tạm dừng: {{ suspended }} ({{ percent(suspended) }}%)
          </div>
        </div>

        <!-- Inactive/Other (calculated as remaining) -->
        <div 
          class="bg-[var(--mp-border)] h-full transition-all duration-700 relative group cursor-pointer"
          :style="{ width: percent(total - active - suspended) + '%' }"
          v-if="(total - active - suspended) > 0"
        >
          <div class="tooltip hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 shadow-lg">
            Khác: {{ total - active - suspended }} ({{ percent(total - active - suspended) }}%)
          </div>
        </div>
      </div>
      <div v-else class="h-4 md:h-5 w-full rounded-full bg-[var(--mp-border)] flex items-center justify-center">
        <span class="text-[10px] text-[var(--mp-text-muted)]">Chưa có dữ liệu</span>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap gap-4 text-xs md:text-sm">
      <div class="flex items-center gap-1.5 cursor-default group">
        <div class="w-3 h-3 rounded-full bg-emerald-500 group-hover:scale-110 transition-transform"></div>
        <span class="mp-text-secondary">Hoạt động ({{ percent(active) }}%)</span>
      </div>
      <div class="flex items-center gap-1.5 cursor-default group">
        <div class="w-3 h-3 rounded-full bg-red-500 group-hover:scale-110 transition-transform"></div>
        <span class="mp-text-secondary">Tạm dừng ({{ percent(suspended) }}%)</span>
      </div>
      
      <!-- Separator -->
      <div class="w-px h-4 bg-[var(--mp-border)] hidden sm:block"></div>

      <!-- Pro Badge overlay stat -->
      <div class="flex items-center gap-1.5 ml-auto cursor-default">
        <div class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">PRO</div>
        <span class="mp-text-primary font-medium">{{ pro }} tenant{{ pro > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  active: { type: Number, default: 0 },
  suspended: { type: Number, default: 0 },
  pro: { type: Number, default: 0 }
})

const percent = (val) => {
  if (!props.total || props.total === 0) return 0
  return Math.round((val / props.total) * 100)
}
</script>

<style scoped>
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: #1f2937 transparent transparent transparent;
}
.chart-wrapper {
  animation: fade-up 0.6s ease-out;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
