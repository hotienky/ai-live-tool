<template>
  <CategoryForm
    v-if="showForm"
    :languagesInstalled="languagesInstalled"
    :editId="editId"
    @back="closeForm"
    @saved="onSaved"
  />
  <CategoryList
    v-else
    ref="listRef"
    @create="openCreate"
    @edit="openEdit"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import CategoryList from './CategoryList.vue'
import CategoryForm from './CategoryForm.vue'

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

function openEdit(c) {
  showForm.value = true
  editId.value = c.id
  emit('navigate', `shop/categories/edit/${c.id}`)
}

function closeForm() {
  showForm.value = false
  editId.value = null
  emit('navigate', 'shop/categories')
  // setTimeout(() => { if (listRef.value) listRef.value.fetchCategories() }, 50)
}

function onSaved(newId) {
  if (newId) {
    editId.value = newId
    emit('navigate', `shop/categories/edit/${newId}`)
  }
}
</script>
