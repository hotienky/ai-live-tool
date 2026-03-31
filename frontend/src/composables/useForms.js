import { ref } from 'vue'
import { apiFetch } from './useApi.js'
import { useToast } from './useToast.js'

// Simple Local Storage backend simulation if Real API is not available
const STORAGE_KEY_FORMS = 'mock_forms_db'
const STORAGE_KEY_SUBS = 'mock_form_submissions_db'

export function useForms() {
  const { showToast } = useToast()
  const forms = ref([])
  const submissions = ref([])

  // Helper cho Local Storage
  const _getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]')
  const _setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data))

  const fetchForms = async () => {
    try {
      // Thử gọi Real API trước
      const res = await apiFetch('/api/forms')
      if (res.ok) {
        const data = await res.json()
        forms.value = Array.isArray(data) ? data : (data?.items || [])
      } else {
        // API trả về lỗi (401, 404, ...), fallback sang Local
        forms.value = _getLocal(STORAGE_KEY_FORMS)
      }
    } catch (e) {
      console.warn('Real API for forms failed, fallback to Local Storage', e)
      forms.value = _getLocal(STORAGE_KEY_FORMS)
    }
    return forms.value
  }

  const saveForm = async (formData) => {
    try {
      // Phân tách Create vs Update
      if (formData.id) {
        // await apiFetch(`/api/forms/${formData.id}`, { method: 'PUT', body: formData })
        const list = _getLocal(STORAGE_KEY_FORMS)
        const idx = list.findIndex(f => f.id === formData.id)
        if (idx > -1) list[idx] = formData
        _setLocal(STORAGE_KEY_FORMS, list)
      } else {
        formData.id = 'form_' + Date.now() + Math.random().toString(36).substr(2, 5)
        // await apiFetch('/api/forms', { method: 'POST', body: formData })
        const list = _getLocal(STORAGE_KEY_FORMS)
        list.push(formData)
        _setLocal(STORAGE_KEY_FORMS, list)
      }
      showToast('Đã lưu biểu mẫu thành công', 'success')
      await fetchForms()
    } catch (e) {
      showToast('Lỗi lưu biểu mẫu', 'error')
    }
  }

  const deleteForm = async (id) => {
    try {
      const list = _getLocal(STORAGE_KEY_FORMS)
      _setLocal(STORAGE_KEY_FORMS, list.filter(f => f.id !== id))
      showToast('Đã xoá biểu mẫu', 'success')
      await fetchForms()
    } catch (e) {
      showToast('Lỗi xoá biểu mẫu', 'error')
    }
  }

  const fetchSubmissions = async (formId = null) => {
    try {
      let data = _getLocal(STORAGE_KEY_SUBS)
      if (formId) {
        data = data.filter(s => s.formId === formId)
      }
      // Sort newest first
      data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      submissions.value = data
      return data
    } catch (e) {
      console.warn('Error fetching submissions')
      return []
    }
  }

  const submitForm = async (formId, payload) => {
    try {
      const data = {
        id: 'sub_' + Date.now(),
        formId,
        payload,
        createdAt: new Date().toISOString()
      }
      const list = _getLocal(STORAGE_KEY_SUBS)
      list.push(data)
      _setLocal(STORAGE_KEY_SUBS, list)
      return { success: true }
    } catch (e) {
      console.error(e)
      return { success: false, message: e.message }
    }
  }

  return {
    forms,
    submissions,
    fetchForms,
    saveForm,
    deleteForm,
    fetchSubmissions,
    submitForm
  }
}
