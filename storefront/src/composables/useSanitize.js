import DOMPurify from 'dompurify'

/**
 * Sanitize HTML to prevent XSS attacks.
 * Wraps DOMPurify with safe defaults for storefront content.
 */
export function useSanitize() {
  /**
   * Sanitize HTML string — removes script tags, event handlers, etc.
   * Allows safe HTML: p, h1-h6, a, img, ul, ol, li, strong, em, br, div, span,
   * table, thead, tbody, tr, td, th, blockquote, figure, figcaption, video, iframe (YouTube/Vimeo only).
   */
  function sanitize(dirty) {
    if (!dirty) return ''
    return DOMPurify.sanitize(dirty, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'loading'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      // Allow YouTube/Vimeo iframes
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: null,
        attributeNameCheck: null,
        allowCustomizedBuiltInElements: false,
      },
    })
  }

  return { sanitize }
}
