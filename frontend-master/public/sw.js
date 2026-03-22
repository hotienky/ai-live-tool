/**
 * Service Worker for Master Admin Panel
 * Cache-first for static assets, network-first for API.
 */
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `master-static-${CACHE_VERSION}`

const PRE_CACHE = ['/', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRE_CACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Static assets → Cache-first
  if (/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico)(\?.*)?$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(request, res.clone()))
          return res
        }).catch(() => new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // HTML navigation → Network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
  }
})
