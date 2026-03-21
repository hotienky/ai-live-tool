<template>
  <BrandForm
    v-if="showForm"
    :languagesInstalled="languagesInstalled"
    :editId="editId"
    @back="closeForm"
    @saved="onSaved"
  />
  <BrandList
    v-else
    ref="listRef"
    @create="openCreate"
    @edit="openEdit"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import BrandList from './BrandList.vue'
import BrandForm from './BrandForm.vue'

const props = defineProps({
  languagesInstalled: { type: Boolean, default: false },
  initialEditId: { type: [String, Number], default: null },
})

const emit = defineEmits(['navigate'])

const showForm = ref(!!props.initialEditId)
const editId = ref(props.initialEditId)
const listRef = ref(null)

watch(() => props.initialEditId, (newId) => {
  if (newId) {
    showForm.value = true
    editId.value = newId
  } else {
    showForm.value = false
    editId.value = null
  }
})

function openCreate() {
  showForm.value = true
  editId.value = null
}

function openEdit(b) {
  showForm.value = true
  editId.value = b.id
  emit('navigate', `shop/brands/edit/${b.id}`)
}

function closeForm() {
  showForm.value = false
  editId.value = null
  emit('navigate', 'shop/brands')
}

function onSaved(newId) {
  if (newId) {
    editId.value = newId
    emit('navigate', `shop/brands/edit/${newId}`)
  }
}
</script>
