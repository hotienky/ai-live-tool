<template>
  <div class="block-node">
    <!-- Top Drop Zone -->
    <div
      v-if="!isChild"
      class="bc-drop-zone"
      :class="{ 'bc-drop-zone--active': dropPath === basePath + '0' }"
      :data-path="basePath + '0'"
    ></div>

    <template v-for="(block, i) in blocks" :key="block.id">
      <div class="block-wrapper">
        <BlockCard
          :block="block"
          :block-def="getBlockDef(block.type)"
          :selected="selectedId === block.id"
          :index="i"
          :total="blocks.length"
          @click="$emit('select', block.id)"
          @remove="$emit('remove', getPath(i))"
          @move-up="$emit('move', getPath(i), getPath(i - 1))"
          @move-down="$emit('move', getPath(i), getPath(i + 1))"
        >
          <!-- Recursively render children if it's a layout block (columns) -->
          <template v-if="block.type.startsWith('columns')">
            <div
              v-for="colIdx in (block.settings?.columns || 2)"
              :key="colIdx"
              class="bc-col"
              :style="{ width: getColumnWidth(block.settings?.layout, colIdx - 1) }"
            >
              <!-- Inside each column, we have a drop zone 0 -->
              <div
                class="bc-drop-zone bc-drop-zone--nested"
                :class="{ 'bc-drop-zone--active': dropPath === getColPath(i, colIdx - 1, 0) }"
                :data-path="getColPath(i, colIdx - 1, 0)"
              ></div>
              <BlockNode
                v-if="block.children && block.children[colIdx - 1]"
                :blocks="block.children[colIdx - 1]"
                :base-path="getColPathBase(i, colIdx - 1)"
                :selected-id="selectedId"
                :drop-path="dropPath"
                :is-child="true"
                @select="$emit('select', $event)"
                @remove="$emit('remove', $event)"
                @move="$emit('move', $arguments[0], $arguments[1])"
              />
            </div>
          </template>
        </BlockCard>

        <!-- Drop zone after the block -->
        <div
          class="bc-drop-zone"
          :class="{ 'bc-drop-zone--active': dropPath === basePath + (i + 1) }"
          :data-path="basePath + (i + 1)"
        ></div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BlockCard from './BlockCard.vue'

defineOptions({ name: 'BlockNode' })

const props = defineProps({
  blocks: { type: Array, default: () => [] },
  basePath: { type: String, default: '' }, // e.g. '' or '1.children.0.'
  selectedId: { type: String, default: null },
  dropPath: { type: String, default: null },
  isChild: { type: Boolean, default: false }
})

defineEmits(['select', 'remove', 'move'])

const bridge = window.__APP_BRIDGE__ || {}
function getBlockDef(type) {
  return bridge.getBlockByType?.(type) || null
}

function getPath(i) {
  return props.basePath + i
}

function getColPathBase(blockIdx, colIdx) {
  return `${props.basePath}${blockIdx}.children.${colIdx}.`
}

function getColPath(blockIdx, colIdx, innerIdx) {
  return getColPathBase(blockIdx, colIdx) + innerIdx
}

function getColumnWidth(layoutParams, colIdx) {
  if (layoutParams === '60-40') {
    return colIdx === 0 ? '60%' : '40%'
  } else if (layoutParams === '40-60') {
    return colIdx === 0 ? '40%' : '60%'
  } else if (layoutParams === '33-33-33') {
    return '33.33%'
  }
  return '50%'
}
</script>

<style scoped>
.block-node {
  display: flex;
  flex-direction: column;
}
.bc-drop-zone {
  height: 4px; border-radius: 2px; margin: 3px 0;
  transition: all .15s;
}
.bc-drop-zone--active {
  height: 24px; background: rgba(124,58,237,.15);
  border: 2px dashed rgba(124,58,237,.4); border-radius: 6px;
}
.bc-col {
  background: rgba(124,58,237,0.03);
  border: 1.5px dashed rgba(124,58,237,0.2);
  border-radius: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  min-height: 50px;
}
.bc-drop-zone--nested {
  height: 20px; border: 1px dashed transparent; margin-bottom: 4px;
}
.bc-drop-zone--nested:not(.bc-drop-zone--active) {
  border-color: rgba(0,0,0,0.1); background: rgba(0,0,0,0.02);
}
</style>
