/**
 * Composable for setting page-level SEO meta tags + JSON-LD.
 *
 * Usage:
 *   const { setPageSeo, setProductSeo } = useSeo()
 *   setPageSeo({ title: '...', description: '...', image: '...' })
 */

function createMetaTag(name, content) {
  if (!content) return
  let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      el.setAttribute('property', name)
    } else {
      el.setAttribute('name', name)
    }
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  if (!url) return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

function setJsonLd(data) {
  // Remove existing JSON-LD scripts with same @type
  const existing = document.querySelectorAll('script[type="application/ld+json"]')
  existing.forEach((el) => {
    try {
      const parsed = JSON.parse(el.textContent)
      if (parsed['@type'] === data['@type']) el.remove()
    } catch { /* ignore */ }
  })
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data })
  document.head.appendChild(script)
}

export function useSeo() {
  function setPageSeo({
    title = '',
    description = '',
    keywords = '',
    image = '',
    url = '',
    type = 'website',
    siteName = '',
  } = {}) {
    // Document title
    if (title) {
      document.title = title
    }

    // Standard meta
    createMetaTag('description', description)
    createMetaTag('keywords', keywords)

    // Open Graph
    createMetaTag('og:title', title)
    createMetaTag('og:description', description)
    createMetaTag('og:image', image)
    createMetaTag('og:url', url || window.location.href)
    createMetaTag('og:type', type)
    if (siteName) createMetaTag('og:site_name', siteName)

    // Twitter Card
    createMetaTag('twitter:card', image ? 'summary_large_image' : 'summary')
    createMetaTag('twitter:title', title)
    createMetaTag('twitter:description', description)
    if (image) createMetaTag('twitter:image', image)

    // Canonical
    setCanonical(url || window.location.href)
  }

  function setProductSeo(product) {
    if (!product) return
    const desc = product.meta_description || product.description?.replace(/<[^>]*>/g, '').slice(0, 160) || ''
    const img = product.image_url || (product.images && product.images[0]) || ''

    setPageSeo({
      title: product.meta_title || product.name,
      description: desc,
      keywords: product.meta_keywords || '',
      image: img,
      type: 'product',
    })

    // JSON-LD Product schema
    const price = product.promotion_price && product.promotion_price < product.price
      ? product.promotion_price : product.price
    setJsonLd({
      '@type': 'Product',
      name: product.name,
      description: desc,
      image: img ? [img] : [],
      sku: product.sku || undefined,
      brand: product.brand_name ? { '@type': 'Brand', name: product.brand_name } : undefined,
      offers: {
        '@type': 'Offer',
        price: String(price || 0),
        priceCurrency: 'VND',
        availability: (product.stock > 0 || product.is_active)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: window.location.href,
      },
    })
  }

  function setCategorySeo(category) {
    if (!category) return
    setPageSeo({
      title: category.name + ' | Sản phẩm',
      description: category.meta_description || category.description || '',
    })
  }

  function setBreadcrumbs(items) {
    // items: [{ name, url }]
    if (!items?.length) return
    setJsonLd({
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    })
  }

  return {
    setPageSeo,
    setProductSeo,
    setCategorySeo,
    setBreadcrumbs,
    setJsonLd,
    createMetaTag,
    setCanonical,
  }
}

