import { ref, computed } from 'vue'
import { apiFetch, apiPost } from '../api.js'

/**
 * Shipping composable — 2-level address (Province → Ward) + VietMap autocomplete
 */
export function useShipping() {
  // Address data
  const provinces = ref([])
  const wards = ref([])
  const loadingProvinces = ref(false)
  const loadingWards = ref(false)

  // Selected address
  const selectedProvince = ref(null)
  const selectedWard = ref(null)
  const selectedProvinceName = ref('')
  const selectedWardName = ref('')

  // VietMap autocomplete
  const addressSuggestions = ref([])
  const loadingSuggestions = ref(false)

  // Shipping options
  const shippingOptions = ref([])
  const selectedShipping = ref(null)
  const loadingShipping = ref(false)
  const shippingError = ref('')

  const shippingFee = computed(() => selectedShipping.value?.fee ?? 0)

  const fullAddress = computed(() => {
    const parts = []
    if (selectedWardName.value) parts.push(selectedWardName.value)
    if (selectedProvinceName.value) parts.push(selectedProvinceName.value)
    return parts.join(', ')
  })

  // Fetch provinces
  async function fetchProvinces() {
    if (provinces.value.length > 0) return
    loadingProvinces.value = true
    try {
      provinces.value = await apiFetch('/shipping/provinces')
    } catch { provinces.value = [] }
    loadingProvinces.value = false
  }

  // Fetch wards by province code
  async function fetchWards(provinceCode) {
    if (!provinceCode) { wards.value = []; return }
    loadingWards.value = true
    try {
      wards.value = await apiFetch(`/shipping/wards/${provinceCode}`)
    } catch { wards.value = [] }
    loadingWards.value = false
  }

  // Province changed
  function onProvinceChange(provinceCode) {
    selectedProvince.value = provinceCode
    const prov = provinces.value.find(p => String(p.code) === String(provinceCode))
    selectedProvinceName.value = prov?.name ?? ''
    selectedWard.value = null
    selectedWardName.value = ''
    wards.value = []
    shippingOptions.value = []
    selectedShipping.value = null
    if (provinceCode) fetchWards(provinceCode)
  }

  // Ward changed
  function onWardChange(wardCode) {
    selectedWard.value = wardCode
    const ward = wards.value.find(w => String(w.code) === String(wardCode))
    selectedWardName.value = ward?.name ?? ''
    calculateShipping()
  }

  // VietMap autocomplete — debounce 300ms, calls backend proxy
  let searchTimeout = null
  async function searchAddress(text) {
    if (!text || text.length < 2) {
      addressSuggestions.value = []
      return
    }
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(async () => {
      loadingSuggestions.value = true
      try {
        const results = await apiFetch(`/shipping/vietmap-autocomplete?text=${encodeURIComponent(text)}`)
        addressSuggestions.value = Array.isArray(results) ? results : []
      } catch {
        addressSuggestions.value = []
      }
      loadingSuggestions.value = false
    }, 300)
  }

  function clearSuggestions() {
    addressSuggestions.value = []
  }

  /**
   * Chọn 1 gợi ý autocomplete → auto-fill province & ward nếu chưa chọn
   */
  async function selectSuggestion(suggestion, form) {
    // Fill address text
    if (form) {
      form.value.customerAddress = suggestion.display || suggestion.address || ''
    }
    clearSuggestions()

    const sProvince = suggestion.province
    const sWard = suggestion.ward

    // Auto-fill province if not selected yet (or still empty)
    if (sProvince && sProvince.name) {
      // Find matching province in our list by fuzzy name match
      const matchProv = findByFuzzyName(provinces.value, sProvince.name)
      if (matchProv && String(matchProv.code) !== String(selectedProvince.value)) {
        selectedProvince.value = matchProv.code
        selectedProvinceName.value = matchProv.name
        // Load wards for this province
        await fetchWards(matchProv.code)
      }
    }

    // Auto-fill ward if province is set
    if (sWard && sWard.name && selectedProvince.value) {
      // Wait for wards to be loaded
      if (wards.value.length === 0) {
        await fetchWards(selectedProvince.value)
      }
      const matchWard = findByFuzzyName(wards.value, sWard.name)
      if (matchWard) {
        selectedWard.value = matchWard.code
        selectedWardName.value = matchWard.name
        calculateShipping()
      }
    }
  }

  /**
   * Fuzzy match: strip prefixes like "Tỉnh", "Thành phố", "Xã", etc. and compare
   */
  function findByFuzzyName(list, name) {
    if (!name || !list.length) return null
    const clean = s => s.replace(/^(Tỉnh|Thành phố|Xã|Phường|Thị trấn|Thị xã|Quận|Huyện)\s+/iu, '').toLowerCase().trim()
    const needle = clean(name)

    // Exact match first
    let match = list.find(item => clean(item.name) === needle)
    if (match) return match

    // Partial match
    match = list.find(item => clean(item.name).includes(needle) || needle.includes(clean(item.name)))
    return match || null
  }

  // Calculate shipping fees
  async function calculateShipping(orderValue = 0) {
    if (!selectedProvince.value) return
    loadingShipping.value = true
    shippingError.value = ''
    shippingOptions.value = []
    selectedShipping.value = null
    try {
      const result = await apiPost('/shipping/calculate', {
        to_province_code: selectedProvince.value,
        to_province_name: selectedProvinceName.value,
        to_ward_code: selectedWard.value || '',
        to_ward_name: selectedWardName.value,
        weight: 500,
        order_value: orderValue,
      })
      shippingOptions.value = result.options || []
      if (shippingOptions.value.length > 0) {
        selectedShipping.value = shippingOptions.value[0]
      }
      if (shippingOptions.value.length === 0 && result.message) {
        shippingError.value = result.message
      }
    } catch (err) {
      shippingError.value = err.message || 'Không thể tính phí vận chuyển'
    }
    loadingShipping.value = false
  }

  function selectShipping(option) {
    selectedShipping.value = option
  }

  return {
    provinces, wards,
    loadingProvinces, loadingWards,
    selectedProvince, selectedWard,
    selectedProvinceName, selectedWardName,
    addressSuggestions, loadingSuggestions,
    shippingOptions, selectedShipping, shippingFee,
    loadingShipping, shippingError, fullAddress,
    fetchProvinces, fetchWards,
    onProvinceChange, onWardChange,
    searchAddress, clearSuggestions, selectSuggestion,
    calculateShipping, selectShipping,
  }
}
