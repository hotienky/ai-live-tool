/**
 * Shared API fetch helper — includes Authorization header automatically.
 * Returns a Response-like object whose .json() auto-unwraps the
 * { type, data } API envelope, so callers always get just the data.
 */
import { API_BASE } from '../config.js'

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

let isRedirecting = false

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  // Handle 401 — clear auth state
  if (res.status === 401 && !isRedirecting) {
    isRedirecting = true
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.dispatchEvent(new Event('auth:logout'))
    isRedirecting = false
  }

  // Handle 403 — tenant suspended
  if (res.status === 403) {
    try {
      const clone = res.clone()
      const body = await clone.json()
      if (body?.error?.includes('suspended') || body?.error?.includes('Tenant is suspended')) {
        document.body.innerHTML = `
          <div style="position:fixed;inset:0;background:#0f172a;display:flex;align-items:center;justify-content:center;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0">
            <div style="text-align:center;max-width:480px;padding:40px">
              <div style="width:72px;height:72px;border-radius:16px;background:linear-gradient(135deg,#f59e0b,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 32px rgba(245,158,11,.3)">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
              </div>
              <h1 style="font-size:24px;font-weight:800;margin:0 0 12px;background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Trang web tạm ngưng hoạt động</h1>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7">Website này hiện đang được tạm dừng bởi quản trị viên.</p>
            </div>
          </div>`
      }
    } catch (_) { /* ignore parse errors */ }
  }

  // Wrap response so .json() auto-unwraps API envelope
  const originalJson = res.json.bind(res)
  res.json = async () => {
    const json = await originalJson()
    // Unwrap: { type: "success", data: ... } → data
    if (json && typeof json === 'object' && 'data' in json && json.type) {
      return json.data
    }
    return json
  }

  return res
}

export { API_BASE }
