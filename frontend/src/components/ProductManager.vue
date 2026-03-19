<template>
  <ProductForm
    v-if="showForm"
    :languagesInstalled="languagesInstalled"
    :editId="editId"
    @back="closeForm"
    @saved="onSaved"
  />
  <ProductList
    v-else
    ref="listRef"
    @create="openCreate"
    @edit="openEdit"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import ProductList from './ProductList.vue'
import ProductForm from './ProductForm.vue'

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
  // We do not formally emit 'shop/products/create' to the global router because App.vue hasn't registered it,
  // but we can locally transition to the form perfectly.
}

function openEdit(p) {
  showForm.value = true
  editId.value = p.id
  emit('navigate', `shop/products/edit/${p.id}`)
}

function closeForm() {
  showForm.value = false
  editId.value = null
  emit('navigate', 'shop/products')
  // Tell list to refresh if needed (can be optional, but good for UX)
  // setTimeout(() => { if (listRef.value) listRef.value.fetchProducts() }, 50)
}

function onSaved(newId) {
  if (newId) {
    // A new product was created, stay on the form
    editId.value = newId
    emit('navigate', `shop/products/edit/${newId}`)
  } else {
    // Existing product updated, stay on the form just like edit
    // (no action needed, already on form and URL is fully set)
  }
}
</script>
