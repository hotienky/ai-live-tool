<template>
  <div class="api-docs">
    <div class="api-docs__header">
      <h2 class="api-docs__title"><BookOpen :size="20" /> API Documentation</h2>
      <p class="api-docs__sub">REST API v1 — Headless CMS endpoints for external integrations</p>
    </div>

    <!-- Quick Start -->
    <div class="api-docs__card api-docs__quickstart">
      <h3><Zap :size="16" /> Quick Start</h3>
      <p>Use your API key to authenticate requests:</p>
      <div class="api-docs__code-block">
        <div class="api-docs__code-header">
          <span>cURL</span>
          <button class="api-docs__copy" @click="copy(curlExample)"><Copy :size="12" /> Copy</button>
        </div>
        <pre><code>{{ curlExample }}</code></pre>
      </div>
      <div class="api-docs__auth-info">
        <div class="api-docs__auth-item">
          <code class="api-docs__key-type api-docs__key-type--pk">pk_live_*</code>
          <span>Public key — Read-only access</span>
        </div>
        <div class="api-docs__auth-item">
          <code class="api-docs__key-type api-docs__key-type--sk">sk_live_*</code>
          <span>Secret key — Read + Write access</span>
        </div>
      </div>
    </div>

    <!-- Endpoint Explorer -->
    <div class="api-docs__endpoints">
      <h3 class="api-docs__section-title">Endpoints</h3>

      <div v-for="group in endpointGroups" :key="group.name" class="api-docs__group">
        <h4 class="api-docs__group-title">
          <component :is="group.icon" :size="15" />
          {{ group.name }}
        </h4>

        <div v-for="ep in group.endpoints" :key="ep.method + ep.path" class="api-docs__endpoint" :class="{ 'api-docs__endpoint--open': openEndpoint === ep.id }" @click="toggleEndpoint(ep.id)">
          <div class="api-docs__endpoint-header">
            <span class="api-docs__method" :class="'api-docs__method--' + ep.method.toLowerCase()">{{ ep.method }}</span>
            <code class="api-docs__path">{{ ep.path }}</code>
            <span class="api-docs__desc">{{ ep.description }}</span>
            <span v-if="ep.auth === 'secret'" class="api-docs__badge api-docs__badge--sk">sk_ required</span>
            <ChevronDown :size="14" class="api-docs__chevron" />
          </div>

          <transition name="slide">
            <div v-if="openEndpoint === ep.id" class="api-docs__endpoint-detail">
              <!-- Parameters -->
              <div v-if="ep.params?.length" class="api-docs__params">
                <h5>Parameters</h5>
                <table class="api-docs__params-table">
                  <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr v-for="p in ep.params" :key="p.name">
                      <td><code>{{ p.name }}</code></td>
                      <td><span class="api-docs__param-type">{{ p.type }}</span></td>
                      <td>{{ p.desc }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Try It -->
              <div class="api-docs__try-it">
                <h5>Try it</h5>
                <div class="api-docs__try-row">
                  <input v-model="tryApiKey" type="text" placeholder="API Key (pk_live_... or sk_live_...)" class="api-docs__try-input" />
                  <button class="api-docs__try-btn" @click.stop="tryEndpoint(ep)" :disabled="trying">
                    <Play :size="13" /> {{ trying ? '...' : 'Send' }}
                  </button>
                </div>
                <div v-if="ep.bodyExample" class="api-docs__try-body">
                  <label>Request Body:</label>
                  <textarea v-model="tryBody" rows="4" class="api-docs__try-textarea"></textarea>
                </div>
              </div>

              <!-- Response -->
              <div v-if="tryResponse" class="api-docs__response">
                <div class="api-docs__response-header">
                  <span class="api-docs__response-status" :class="tryStatus < 300 ? 'status--ok' : 'status--err'">{{ tryStatus }}</span>
                  <span>Response</span>
                </div>
                <pre class="api-docs__response-body"><code>{{ tryResponse }}</code></pre>
              </div>

              <!-- Code Snippets -->
              <div class="api-docs__snippets">
                <h5>Code Snippets</h5>
                <div class="api-docs__snippet-tabs">
                  <button v-for="lang in ['cURL', 'JavaScript', 'Python']" :key="lang" :class="{ active: snippetLang === lang }" @click.stop="snippetLang = lang">{{ lang }}</button>
                </div>
                <div class="api-docs__code-block">
                  <button class="api-docs__copy api-docs__copy--sm" @click.stop="copy(getSnippet(ep, snippetLang))"><Copy :size="11" /></button>
                  <pre><code>{{ getSnippet(ep, snippetLang) }}</code></pre>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Response Format -->
    <div class="api-docs__card">
      <h3><FileJson :size="16" /> Response Format</h3>
      <div class="api-docs__code-block">
        <pre><code>{{ responseFormatExample }}</code></pre>
      </div>
    </div>

    <!-- Rate Limiting -->
    <div class="api-docs__card">
      <h3><Gauge :size="16" /> Rate Limiting</h3>
      <p>Requests are limited per API key per hour. Rate limit info is included in response headers.</p>
      <table class="api-docs__params-table">
        <thead><tr><th>Header</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>X-RateLimit-Limit</code></td><td>Max requests per hour</td></tr>
          <tr><td><code>X-RateLimit-Remaining</code></td><td>Remaining requests</td></tr>
          <tr><td><code>Retry-After</code></td><td>Seconds until rate limit resets (when limited)</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BookOpen, Zap, Copy, ChevronDown, Play, FileJson, Gauge, Globe, FileText, Image, Search, Menu, Tag } from 'lucide-vue-next'
import { API_BASE } from '../config.js'

const openEndpoint = ref(null)
const tryApiKey = ref('')
const tryBody = ref('')
const tryResponse = ref('')
const tryStatus = ref(0)
const trying = ref(false)
const snippetLang = ref('cURL')

const baseUrl = `${window.location.origin}/api/v1`

const curlExample = `curl -H "X-API-Key: pk_live_YOUR_KEY" \\
  ${baseUrl}/content/post`

const responseFormatExample = `{
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8
  },
  "links": {
    "next": "/api/v1/content/post?page=2",
    "prev": null
  }
}`

const endpointGroups = [
  {
    name: 'Site', icon: Globe,
    endpoints: [
      { id: 'site', method: 'GET', path: '/api/v1/site', description: 'Site configuration & theme', params: [] },
    ]
  },
  {
    name: 'Content', icon: FileText,
    endpoints: [
      {
        id: 'content-list', method: 'GET', path: '/api/v1/content/{type}',
        description: 'List content (paginated)',
        params: [
          { name: 'type', type: 'path', desc: 'Content type: post, page, etc.' },
          { name: 'per_page', type: 'query', desc: 'Items per page (max 100, default 20)' },
          { name: 'page', type: 'query', desc: 'Page number' },
          { name: 'sort', type: 'query', desc: 'Sort field. Prefix - for desc. e.g., -published_at' },
          { name: 'fields', type: 'query', desc: 'Comma-separated fields: title,slug,excerpt' },
          { name: 'include', type: 'query', desc: 'Relations: author,taxonomies,revisions' },
          { name: 'filter[status]', type: 'query', desc: 'Filter by status: draft, published' },
          { name: 'filter[category]', type: 'query', desc: 'Filter by category term' },
        ],
      },
      {
        id: 'content-show', method: 'GET', path: '/api/v1/content/{type}/{slug}',
        description: 'Single content by slug',
        params: [
          { name: 'type', type: 'path', desc: 'Content type' },
          { name: 'slug', type: 'path', desc: 'Content slug' },
          { name: 'include', type: 'query', desc: 'Relations to include' },
        ],
      },
      {
        id: 'content-create', method: 'POST', path: '/api/v1/content/{type}',
        description: 'Create content', auth: 'secret',
        bodyExample: '{"title":"My Post","body":"Content...","status":"draft"}',
        params: [{ name: 'type', type: 'path', desc: 'Content type' }],
      },
      {
        id: 'content-update', method: 'PUT', path: '/api/v1/content/{type}/{id}',
        description: 'Update content', auth: 'secret',
        bodyExample: '{"title":"Updated Title"}',
        params: [
          { name: 'type', type: 'path', desc: 'Content type' },
          { name: 'id', type: 'path', desc: 'Content ID' },
        ],
      },
      {
        id: 'content-delete', method: 'DELETE', path: '/api/v1/content/{type}/{id}',
        description: 'Delete content', auth: 'secret',
        params: [
          { name: 'type', type: 'path', desc: 'Content type' },
          { name: 'id', type: 'path', desc: 'Content ID' },
        ],
      },
    ]
  },
  {
    name: 'Taxonomies', icon: Tag,
    endpoints: [
      {
        id: 'tax-list', method: 'GET', path: '/api/v1/taxonomies/{type}',
        description: 'List taxonomy terms',
        params: [{ name: 'type', type: 'path', desc: 'Taxonomy type: category, tag' }],
      },
    ]
  },
  {
    name: 'Media', icon: Image,
    endpoints: [
      { id: 'media-show', method: 'GET', path: '/api/v1/media/{id}', description: 'Media file info + URL', params: [{ name: 'id', type: 'path', desc: 'Media ID' }] },
      { id: 'media-upload', method: 'POST', path: '/api/v1/media', description: 'Upload file', auth: 'secret', params: [] },
    ]
  },
  {
    name: 'Menus', icon: Menu,
    endpoints: [
      { id: 'menus-list', method: 'GET', path: '/api/v1/menus', description: 'List menu locations', params: [] },
      { id: 'menus-show', method: 'GET', path: '/api/v1/menus/{location}', description: 'Menu tree by location', params: [{ name: 'location', type: 'path', desc: 'Menu location slug' }] },
    ]
  },
  {
    name: 'Search', icon: Search,
    endpoints: [
      {
        id: 'search', method: 'GET', path: '/api/v1/search',
        description: 'Full-text search across content',
        params: [
          { name: 'q', type: 'query', desc: 'Search query (required)' },
          { name: 'type', type: 'query', desc: 'Limit to content type' },
          { name: 'per_page', type: 'query', desc: 'Results per page' },
        ],
      },
    ]
  },
]

function toggleEndpoint(id) {
  openEndpoint.value = openEndpoint.value === id ? null : id
  tryResponse.value = ''
  tryStatus.value = 0
  const ep = endpointGroups.flatMap(g => g.endpoints).find(e => e.id === id)
  tryBody.value = ep?.bodyExample || ''
}

async function tryEndpoint(ep) {
  if (!tryApiKey.value) return
  trying.value = true
  tryResponse.value = ''
  try {
    const url = `${window.location.origin}${ep.path.replace('{type}', 'post').replace('{slug}', 'example').replace('{id}', '1').replace('{location}', 'main')}`
    const opts = {
      method: ep.method,
      headers: { 'X-API-Key': tryApiKey.value, 'Accept': 'application/json', 'Content-Type': 'application/json' },
    }
    if (['POST', 'PUT'].includes(ep.method) && tryBody.value) {
      opts.body = tryBody.value
    }
    const res = await fetch(url, opts)
    tryStatus.value = res.status
    const data = await res.json()
    tryResponse.value = JSON.stringify(data, null, 2)
  } catch (e) {
    tryResponse.value = `Error: ${e.message}`
    tryStatus.value = 0
  }
  trying.value = false
}

function getSnippet(ep, lang) {
  const url = `${baseUrl}${ep.path}`
  if (lang === 'cURL') {
    let cmd = `curl -X ${ep.method} "${url}" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Accept: application/json"`
    if (ep.bodyExample) cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${ep.bodyExample}'`
    return cmd
  }
  if (lang === 'JavaScript') {
    let code = `const res = await fetch("${url}", {\n  method: "${ep.method}",\n  headers: {\n    "X-API-Key": "YOUR_API_KEY",\n    "Accept": "application/json",`
    if (ep.bodyExample) code += `\n    "Content-Type": "application/json",`
    code += `\n  },`
    if (ep.bodyExample) code += `\n  body: JSON.stringify(${ep.bodyExample}),`
    code += `\n})\nconst data = await res.json()\nconsole.log(data)`
    return code
  }
  if (lang === 'Python') {
    let code = `import requests\n\nres = requests.${ep.method.toLowerCase()}(\n    "${url}",\n    headers={"X-API-Key": "YOUR_API_KEY"},`
    if (ep.bodyExample) code += `\n    json=${ep.bodyExample},`
    code += `\n)\nprint(res.json())`
    return code
  }
  return ''
}

function copy(text) {
  navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.api-docs { max-width: 960px; }
.api-docs__header { margin-bottom: 32px; }
.api-docs__title {
  display: flex; align-items: center; gap: 10px;
  font-size: 24px; font-weight: 800; margin: 0 0 8px;
}
.api-docs__title svg { color: var(--accent); }
.api-docs__sub { font-size: 14px; color: var(--text-3); margin: 0; }

/* Cards */
.api-docs__card {
  padding: 24px; border-radius: 14px; margin-bottom: 24px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}
.api-docs__card h3 {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 700; margin: 0 0 12px;
}
.api-docs__card p { font-size: 14px; color: var(--text-2); line-height: 1.6; margin: 0 0 16px; }

/* Code blocks */
.api-docs__code-block {
  background: var(--bg-3, #1e1e2e); border-radius: 10px; overflow: hidden; position: relative;
}
.api-docs__code-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px; background: rgba(0,0,0,0.2); font-size: 12px; font-weight: 600; color: var(--text-3);
}
.api-docs__code-block pre {
  margin: 0; padding: 14px; font-size: 13px; line-height: 1.5;
  color: #e5e7eb; overflow-x: auto; white-space: pre-wrap; word-break: break-all;
}
.api-docs__copy {
  display: flex; align-items: center; gap: 4px; padding: 4px 10px;
  border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
  background: transparent; color: rgba(255,255,255,0.6); font-size: 11px;
  cursor: pointer; transition: all 0.2s;
}
.api-docs__copy:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
.api-docs__copy--sm { position: absolute; top: 8px; right: 8px; }

/* Auth info */
.api-docs__auth-info { display: flex; gap: 20px; margin-top: 16px; }
.api-docs__auth-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); }
.api-docs__key-type { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.api-docs__key-type--pk { background: rgba(16,185,129,0.12); color: #10b981; }
.api-docs__key-type--sk { background: rgba(239,68,68,0.12); color: #ef4444; }

/* Endpoints */
.api-docs__section-title { font-size: 18px; font-weight: 700; margin: 0 0 16px; }
.api-docs__group { margin-bottom: 24px; }
.api-docs__group-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--text-2); margin: 0 0 10px;
}

.api-docs__endpoint {
  border: 1px solid var(--glass-border); border-radius: 10px;
  margin-bottom: 8px; overflow: hidden; transition: all 0.2s;
  background: var(--glass-bg);
}
.api-docs__endpoint:hover { border-color: var(--color-border-hover); }
.api-docs__endpoint--open { border-color: var(--accent); }

.api-docs__endpoint-header {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; cursor: pointer; font-size: 13px;
}
.api-docs__method {
  padding: 3px 10px; border-radius: 6px; font-size: 11px;
  font-weight: 800; text-transform: uppercase; flex-shrink: 0;
}
.api-docs__method--get { background: rgba(16,185,129,0.12); color: #10b981; }
.api-docs__method--post { background: rgba(59,130,246,0.12); color: #3b82f6; }
.api-docs__method--put { background: rgba(245,158,11,0.12); color: #f59e0b; }
.api-docs__method--delete { background: rgba(239,68,68,0.12); color: #ef4444; }

.api-docs__path { font-size: 13px; font-weight: 600; color: var(--text-1); }
.api-docs__desc { flex: 1; color: var(--text-3); font-size: 12px; }
.api-docs__badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.api-docs__badge--sk { background: rgba(239,68,68,0.1); color: #ef4444; }
.api-docs__chevron { transition: transform 0.2s; color: var(--text-3); flex-shrink: 0; }
.api-docs__endpoint--open .api-docs__chevron { transform: rotate(180deg); }

/* Endpoint detail */
.api-docs__endpoint-detail { padding: 0 16px 16px; border-top: 1px solid var(--glass-border); }

/* Params table */
.api-docs__endpoint-detail h5 { font-size: 13px; font-weight: 700; margin: 16px 0 8px; color: var(--text-2); }
.api-docs__params-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.api-docs__params-table th {
  text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-3);
  border-bottom: 1px solid var(--glass-border);
}
.api-docs__params-table td { padding: 8px 12px; border-bottom: 1px solid var(--glass-border); color: var(--text-2); }
.api-docs__params-table code { padding: 2px 6px; border-radius: 4px; background: var(--bg-3); font-size: 12px; }
.api-docs__param-type { font-size: 11px; color: var(--accent); font-weight: 600; }

/* Try it */
.api-docs__try-row { display: flex; gap: 8px; }
.api-docs__try-input {
  flex: 1; padding: 8px 14px; border-radius: 8px;
  border: 1px solid var(--glass-border); background: var(--bg-2);
  font-size: 13px; color: var(--text-1); font-family: monospace;
}
.api-docs__try-input:focus { outline: none; border-color: var(--accent); }
.api-docs__try-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 18px;
  border-radius: 8px; border: none; font-size: 13px; font-weight: 700;
  background: var(--accent); color: #fff; cursor: pointer;
}
.api-docs__try-btn:disabled { opacity: 0.5; }
.api-docs__try-body { margin-top: 8px; }
.api-docs__try-body label { font-size: 12px; font-weight: 600; color: var(--text-3); display: block; margin-bottom: 4px; }
.api-docs__try-textarea {
  width: 100%; padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--glass-border); background: var(--bg-2);
  font-size: 13px; color: var(--text-1); font-family: monospace; resize: vertical;
}

/* Response */
.api-docs__response { margin-top: 12px; }
.api-docs__response-header {
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; margin-bottom: 6px;
}
.api-docs__response-status { padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.status--ok { background: rgba(16,185,129,0.12); color: #10b981; }
.status--err { background: rgba(239,68,68,0.12); color: #ef4444; }
.api-docs__response-body { max-height: 300px; overflow: auto; }

/* Snippets */
.api-docs__snippet-tabs { display: flex; gap: 4px; margin-bottom: 8px; }
.api-docs__snippet-tabs button {
  padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--glass-border); background: transparent;
  color: var(--text-3); cursor: pointer; transition: all 0.2s;
}
.api-docs__snippet-tabs button.active {
  background: var(--accent); color: #fff; border-color: var(--accent);
}

/* Slide transition */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; }

@media (max-width: 768px) {
  .api-docs__endpoint-header { flex-wrap: wrap; }
  .api-docs__auth-info { flex-direction: column; gap: 8px; }
  .api-docs__try-row { flex-direction: column; }
}
</style>
