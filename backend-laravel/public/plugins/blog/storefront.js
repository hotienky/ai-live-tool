/**
 * Blog Plugin — Storefront Bundle
 *
 * Registers storefront-facing components via __SF_BRIDGE__:
 * - Homepage section: Latest blog posts grid
 * - Widgets: LatestPosts, BlogCategories
 *
 * This bundle is loaded by the storefront app when the blog module is active.
 */
;(function () {
  'use strict'

  const SF = window.__SF_BRIDGE__
  const { h, ref, computed, onMounted, createTextVNode } = window.Vue
  const { BookOpen, Clock, ArrowRight, User, Tag, ChevronRight } = window.LucideVueNext || {}

  if (!SF) {
    console.warn('[Blog Storefront] __SF_BRIDGE__ not available')
    return
  }

  const apiFetch = SF.apiFetch
  const t = SF.t || ((k, v) => v || k)

  // ═══════════════════════════════════════
  // Helper: format date
  // ═══════════════════════════════════════
  function fmtDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // ═══════════════════════════════════════
  // LatestPostsSection — Homepage widget
  // ═══════════════════════════════════════
  const LatestPostsSection = {
    name: 'LatestPostsSection',
    props: {
      params: { type: Object, default: () => ({}) },
      section: { type: Object, default: () => ({}) },
    },
    setup(props) {
      const posts = ref([])
      const loading = ref(true)
      const count = computed(() => props.params?.count || 6)

      async function loadPosts() {
        loading.value = true
        try {
          const res = await apiFetch('/blog/posts', {
            limit: count.value,
            sort: 'published_at',
            order: 'desc',
          })
          const data = res || []
          posts.value = Array.isArray(data) ? data : (data.data || [])
        } catch (err) {
          console.error('[Blog SF] Failed to load posts:', err)
          posts.value = []
        }
        loading.value = false
      }

      onMounted(loadPosts)

      return { posts, loading, count }
    },
    render() {
      const s = this

      // Don't render if no posts and not loading
      if (!s.loading && s.posts.length === 0) return null

      return h('section', { class: 'sf-blog-section container' }, [
        // Section Header
        h('div', { class: 'sf-blog-section__header' }, [
          h('h2', { class: 'sf-blog-section__title' }, [
            BookOpen ? h(BookOpen, { size: 22, class: 'sf-blog-section__icon' }) : null,
            ' ',
            t('storefront.latest_posts', 'Bài viết mới nhất'),
          ]),
          h('a', {
            href: '/blog',
            class: 'sf-blog-section__viewall',
            onClick: (e) => {
              e.preventDefault()
              window.history.pushState({}, '', '/blog')
              window.dispatchEvent(new PopStateEvent('popstate'))
            },
          }, [
            t('storefront.view_all', 'Xem tất cả'),
            ' ',
            ArrowRight ? h(ArrowRight, { size: 14 }) : null,
          ]),
        ]),

        // Loading skeleton
        s.loading
          ? h('div', { class: 'sf-blog-grid' },
              Array.from({ length: 3 }, (_, i) =>
                h('div', { key: i, class: 'sf-blog-card sf-blog-card--skeleton' }, [
                  h('div', { class: 'sf-blog-card__img skeleton' }),
                  h('div', { class: 'sf-blog-card__body' }, [
                    h('div', { class: 'skeleton', style: 'height:16px;width:70%;margin-bottom:8px' }),
                    h('div', { class: 'skeleton', style: 'height:12px;width:90%' }),
                    h('div', { class: 'skeleton', style: 'height:12px;width:50%;margin-top:8px' }),
                  ]),
                ])
              )
            )
          : h('div', { class: 'sf-blog-grid' },
              s.posts.slice(0, s.count).map(post =>
                h('a', {
                  key: post.id,
                  href: `/blog/${post.slug || post.id}`,
                  class: 'sf-blog-card',
                  onClick: (e) => {
                    e.preventDefault()
                    window.history.pushState({}, '', `/blog/${post.slug || post.id}`)
                    window.dispatchEvent(new PopStateEvent('popstate'))
                  },
                }, [
                  // Featured Image
                  post.featured_image || post.image
                    ? h('img', {
                        src: post.featured_image || post.image,
                        alt: post.title,
                        class: 'sf-blog-card__img',
                        loading: 'lazy',
                      })
                    : h('div', { class: 'sf-blog-card__img sf-blog-card__img--empty' }, [
                        BookOpen ? h(BookOpen, { size: 32 }) : null,
                      ]),

                  // Content
                  h('div', { class: 'sf-blog-card__body' }, [
                    h('h3', { class: 'sf-blog-card__title' }, post.title),
                    post.excerpt
                      ? h('p', { class: 'sf-blog-card__excerpt' }, post.excerpt.slice(0, 120) + (post.excerpt.length > 120 ? '...' : ''))
                      : null,
                    h('div', { class: 'sf-blog-card__meta' }, [
                      Clock ? h(Clock, { size: 12 }) : null,
                      ' ',
                      h('span', null, fmtDate(post.published_at || post.created_at)),
                      post.author_name ? h('span', { class: 'sf-blog-card__author' }, [
                        ' · ',
                        User ? h(User, { size: 12 }) : null,
                        ' ',
                        post.author_name,
                      ]) : null,
                    ]),
                    // Categories
                    post.taxonomies?.length
                      ? h('div', { class: 'sf-blog-card__tags' },
                          post.taxonomies
                            .filter(tx => tx.taxonomy === 'category')
                            .slice(0, 2)
                            .map(tx => h('span', { key: tx.id, class: 'sf-blog-card__tag' }, tx.term))
                        )
                      : null,
                  ]),
                ])
              )
            ),
      ])
    },
  }

  // ═══════════════════════════════════════
  // BlogCategoriesWidget — Sidebar/footer widget
  // ═══════════════════════════════════════
  const BlogCategoriesWidget = {
    name: 'BlogCategoriesWidget',
    setup() {
      const categories = ref([])

      onMounted(async () => {
        try {
          const res = await apiFetch('/blog/categories')
          categories.value = Array.isArray(res) ? res : (res?.data || [])
        } catch { categories.value = [] }
      })

      return { categories }
    },
    render() {
      if (!this.categories.length) return null
      return h('div', { class: 'sf-blog-categories' }, [
        h('h4', { class: 'sf-blog-categories__title' }, t('storefront.blog_categories', 'Danh mục Blog')),
        h('ul', { class: 'sf-blog-categories__list' },
          this.categories.map(cat =>
            h('li', { key: cat.id || cat.term }, [
              h('a', {
                href: `/blog?category=${cat.term || cat.slug}`,
                class: 'sf-blog-categories__link',
              }, [
                ChevronRight ? h(ChevronRight, { size: 14 }) : null,
                ' ',
                cat.term || cat.name,
                cat.count ? h('span', { class: 'sf-blog-categories__count' }, `(${cat.count})`) : null,
              ]),
            ])
          )
        ),
      ])
    },
  }

  // ═══════════════════════════════════════
  // Register with __SF_BRIDGE__
  // ═══════════════════════════════════════
  SF.registerPlugin('blog', {
    // Homepage sections
    sections: [
      {
        type: 'blog_posts',
        component: LatestPostsSection,
        order: 50, // After ecom sections, before trust badges
      },
    ],
    // Named widgets
    widgets: {
      'latest-posts': LatestPostsSection,
      'categories': BlogCategoriesWidget,
    },
  })

  console.log('[Blog Storefront] Blog storefront plugin loaded ✅')
})()
