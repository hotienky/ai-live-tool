import { ref, computed, inject, onMounted, onUnmounted } from 'vue'

/**
 * useResponsiveConfig
 * Automatically merges config, tabletConfig, and mobileConfig properties
 * based on the current viewport or Builder preview mode.
 */
export function useResponsiveConfig(props) {
  // Inject preview device state if inside StorefrontLayoutBuilder
  let previewDevice = null
  try {
    previewDevice = inject('previewDevice', null)
  } catch (e) {
    // If not called inside setup or inject fails
  }
  
  const windowDevice = ref('desktop')
  
  const updateDevice = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 768) windowDevice.value = 'mobile'
      else if (window.innerWidth <= 1024) windowDevice.value = 'tablet'
      else windowDevice.value = 'desktop'
    }
  }

  onMounted(() => {
    if (!previewDevice) {
      updateDevice()
      window.addEventListener('resize', updateDevice)
    }
  })
  
  onUnmounted(() => {
    if (!previewDevice) {
      window.removeEventListener('resize', updateDevice)
    }
  })

  const currentDevice = computed(() => {
    return previewDevice ? previewDevice.value : windowDevice.value
  })

  const responsiveConfig = computed(() => {
    const desktop = props.config || {}
    const tablet = props.tabletConfig || {}
    const mobile = props.mobileConfig || {}
    
    const result = { ...desktop }
    
    // Apply tablet overrides
    if (currentDevice.value === 'tablet' || currentDevice.value === 'mobile') {
      for (const k in tablet) {
        if (tablet[k] !== undefined && tablet[k] !== '') result[k] = tablet[k]
      }
      for (const k in desktop) {
        if (k.startsWith('tablet') && desktop[k] !== undefined && desktop[k] !== '') {
          const baseKey = k.substring(6, 7).toLowerCase() + k.substring(7)
          result[baseKey] = desktop[k]
        }
      }
    }
    
    // Apply mobile overrides
    if (currentDevice.value === 'mobile') {
      for (const k in mobile) {
        if (mobile[k] !== undefined && mobile[k] !== '') result[k] = mobile[k]
      }
      for (const k in desktop) {
        if (k.startsWith('mobile') && desktop[k] !== undefined && desktop[k] !== '') {
          const baseKey = k.substring(6, 7).toLowerCase() + k.substring(7)
          result[baseKey] = desktop[k]
        }
      }
    }
    
    return result
  })

  return { responsiveConfig, currentDevice }
}
