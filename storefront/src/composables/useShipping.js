import { ref, computed, watch } from 'vue'
import { apiFetch, apiPost } from '../api.js'

/**
 * Shipping composable — address selector + fee calculation
 */
export function useShipping() {
  // Address data
  const provinces = ref([])
  const districts = ref([])
  const wards = ref([])
  const loadingProvinces = ref(false)
  const loadingDistricts = ref(false)
  const loadingWards = ref(false)

  // Selected address
  const selectedProvince = ref(null)
  const selectedDistrict = ref(null)
  const selectedWard = ref(null)
  const selectedProvinceName = ref('')
  const selectedDistrictName = ref('')
  const selectedWardName = ref('')

  // Shipping options
  const shippingOptions = ref([])
  const selectedShipping = ref(null)
  const loadingShipping = ref(false)
  const shippingError = ref('')

  const shippingFee = computed(() => selectedShipping.value?.fee ?? 0)

  const fullAddress = computed(() => {
    const parts = []
    if (selectedWardName.value) parts.push(selectedWardName.value)
    if (selectedDistrictName.value) parts.push(selectedDistrictName.value)
    if (selectedProvinceName.value) parts.push(selectedProvinceName.value)
    return parts.join(', ')
  })

  // Fetch provinces on first load
  async function fetchProvinces() {
    if (provinces.value.length > 0) return
    loadingProvinces.value = true
    try {
      provinces.value = await apiFetch('/shipping/provinces')
    } catch { provinces.value = [] }
    loadingProvinces.value = false
  }

  // Fetch districts when province changes
  async function fetchDistricts(provinceId) {
    if (!provinceId) { districts.value = []; return }
    loadingDistricts.value = true
    try {
      districts.value = await apiFetch(`/shipping/districts/${provinceId}`)
    } catch { districts.value = [] }
    loadingDistricts.value = false
  }

  // Fetch wards when district changes
  async function fetchWards(districtId) {
    if (!districtId) { wards.value = []; return }
    loadingWards.value = true
    try {
      wards.value = await apiFetch(`/shipping/wards/${districtId}`)
    } catch { wards.value = [] }
    loadingWards.value = false
  }

  // Province changed
  function onProvinceChange(provinceId) {
    selectedProvince.value = provinceId
    const prov = provinces.value.find(p => String(p.id) === String(provinceId))
    selectedProvinceName.value = prov?.name ?? ''
    selectedDistrict.value = null
    selectedDistrictName.value = ''
    selectedWard.value = null
    selectedWardName.value = ''
    districts.value = []
    wards.value = []
    shippingOptions.value = []
    selectedShipping.value = null
    if (provinceId) fetchDistricts(provinceId)
  }

  // District changed
  function onDistrictChange(districtId) {
    selectedDistrict.value = districtId
    const dist = districts.value.find(d => String(d.id) === String(districtId))
    selectedDistrictName.value = dist?.name ?? ''
    selectedWard.value = null
    selectedWardName.value = ''
    wards.value = []
    shippingOptions.value = []
    selectedShipping.value = null
    if (districtId) fetchWards(districtId)
  }

  // Ward changed
  function onWardChange(wardId) {
    selectedWard.value = wardId
    const ward = wards.value.find(w => String(w.id) === String(wardId))
    selectedWardName.value = ward?.name ?? ''
    // Auto-calculate when ward is selected
    calculateShipping()
  }

  // Calculate shipping fees
  async function calculateShipping(orderValue = 0) {
    if (!selectedDistrict.value) return
    loadingShipping.value = true
    shippingError.value = ''
    shippingOptions.value = []
    selectedShipping.value = null
    try {
      const result = await apiPost('/shipping/calculate', {
        to_province_id: selectedProvince.value,
        to_province_name: selectedProvinceName.value,
        to_district_id: selectedDistrict.value,
        to_district_name: selectedDistrictName.value,
        to_ward_code: selectedWard.value || '',
        to_ward_name: selectedWardName.value,
        weight: 500, // default weight
        order_value: orderValue,
      })
      shippingOptions.value = result.options || []
      // Auto-select cheapest option
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
    provinces, districts, wards,
    loadingProvinces, loadingDistricts, loadingWards,
    selectedProvince, selectedDistrict, selectedWard,
    selectedProvinceName, selectedDistrictName, selectedWardName,
    shippingOptions, selectedShipping, shippingFee,
    loadingShipping, shippingError, fullAddress,
    fetchProvinces, fetchDistricts, fetchWards,
    onProvinceChange, onDistrictChange, onWardChange,
    calculateShipping, selectShipping,
  }
}
