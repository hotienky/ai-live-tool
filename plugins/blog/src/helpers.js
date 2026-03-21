// Blog Plugin — Bridge API Wrapper
const bridge = window.__APP_BRIDGE__ || {}

export const apiFetch = bridge.apiFetch || (async () => {})
export const useToast = bridge.useToast || (() => ({ showToast: () => {} }))
export const useI18n = bridge.useI18n || (() => ({ t: (k, fb) => fb }))
export const logger = bridge.logger || console

export default bridge
