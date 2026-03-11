/**
 * AI Service — Enhanced Gemini API integration
 * Multi-language support (Vietnamese focus), improved prompts, batch analysis
 */
import env from '#start/env'

const GEMINI_API_KEY = env.get('GEMINI_API_KEY', '')

let genAI: any = null
let model: any = null

async function getModel() {
  if (model) return model
  if (!GEMINI_API_KEY) return null

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 256,
    },
  })
  return model
}

export async function analyzeComment(
  comment: string,
  context?: { shopName?: string; products?: string[] }
): Promise<{ label: string; summary: string; product_intent: string }> {
  const m = await getModel()
  if (!m) {
    return fallbackAnalysis(comment)
  }

  const productList = context?.products?.length
    ? `\nSản phẩm đang bán: ${context.products.join(', ')}`
    : ''

  const prompt = `Bạn là AI phân tích bình luận livestream bán hàng. Phân tích comment sau:
Comment: "${comment}"${productList}

Trả lời bằng JSON: {"label":"HOT|WARM|COLD","summary":"lý do ngắn","product_intent":"sản phẩm nếu có"}

Quy tắc phân loại:
- HOT = muốn mua rõ ràng: hỏi giá, cách đặt, "muốn mua", "ship cho em", "lấy 1", "inbox", "đặt hàng", "+1", comment số lượng
- WARM = quan tâm nhưng chưa chắc: hỏi chi tiết sản phẩm, chất lượng, size, màu, review
- COLD = chào hỏi, bình luận chung, spam, sticker, emoji, không liên quan mua bán

Lưu ý:
- Ưu tiên phân loại chính xác cho tiếng Việt (bao gồm cả viết tắt: "bn", "bnh", "ib", "sdt", "đt")
- Nếu comment chỉ là sticker/emoji → COLD
- Nếu comment có số (1, 2, 3...) kèm ngữ cảnh mua → HOT
- "+" hoặc số đứng một mình có thể là HOT nếu trong ngữ cảnh livestream bán hàng`

  try {
    const result = await m.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      // Normalize label format
      if (parsed.label && !parsed.label.startsWith('[')) {
        parsed.label = parsed.label.toUpperCase()
      }
      return parsed
    }
    return fallbackAnalysis(comment)
  } catch (err: any) {
    console.error('AI Error:', err.message)
    return fallbackAnalysis(comment)
  }
}

/**
 * Batch analyze multiple comments
 */
export async function analyzeBatch(
  comments: Array<{ id: string; text: string }>
): Promise<Array<{ id: string; label: string; summary: string }>> {
  const m = await getModel()
  if (!m) {
    return comments.map((c) => ({
      id: c.id,
      ...fallbackAnalysis(c.text),
    }))
  }

  const commentList = comments
    .map((c, i) => `${i + 1}. [${c.id}] "${c.text}"`)
    .join('\n')

  const prompt = `Phân tích ${comments.length} bình luận livestream. Trả lời bằng JSON array:
${commentList}

Format: [{"id":"<id>","label":"HOT|WARM|COLD","summary":"lý do ngắn"}]`

  try {
    const result = await m.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (err: any) {
    console.error('AI Batch Error:', err.message)
  }

  return comments.map((c) => ({
    id: c.id,
    ...fallbackAnalysis(c.text),
  }))
}

/**
 * Fallback keyword-based analysis when AI is unavailable
 */
function fallbackAnalysis(comment: string): {
  label: string
  summary: string
  product_intent: string
} {
  const lower = comment.toLowerCase().trim()

  // HOT signals (buying intent)
  const hotPatterns = [
    /muốn\s*mua/, /mua\s*ngay/, /đặt\s*hàng/, /ship\s*(cho|dùm|giùm)/,
    /inbox\s*(mình|em|shop)/, /cho\s*(em|mình)\s*(1|một|hai|2)/,
    /lấy\s*\d/, /\+\s*\d/, /giá\s*(bao|bnh|bn)/, /bao\s*nhiêu/,
    /còn\s*hàng/, /sdt/, /số\s*điện\s*thoại/, /chốt\s*đơn/,
    /^[+]\d*$/, /ib\s*(shop|mình|em)/, /cách\s*đặt/,
    // ── Enhanced Vietnamese patterns ──
    /giá\s*\d+/, /\d+k\b/, /\d+\s*ngàn/, /\d+\s*nghìn/, /\d+\s*đồng/,
    /mấy\s*(cục|cái|tờ|chai|hộp|gói|bộ|chiếc)/,
    /bao\s*(nhiêu|nhiu)\s*(tờ|cục|cái|tiền|vậy)/,
    /giá\s*(sao|vậy|thế|nào|ny|v)/, /giao\s*hàng/, /ship\s*(về|đi|k|ko|không)/,
    /cho\s*(xin|hỏi|em)\s*(giá|sđt|số|link)/, /đặt\s*(1|2|3|một|mấy)/,
    /mua\s*(đi|nha|nhé|luôn|dc|được)/, /có\s*giao/, /gửi\s*(về|cho)/,
    /\b(ib|inbox|dm)\b/i, /lấy\s*(hàng|đơn)/, /thanh\s*toán/,
    /đặt\s*(đơn|cho)/, /order/, /có\s*ship/, /fship|freeship/i,
  ]

  // WARM signals (interested but not committed)
  const warmPatterns = [
    /chất\s*lượng/, /review/, /size/, /màu/, /feedback/,
    /dùng\s*(có|được)/, /có\s*tốt/, /so\s*với/, /khác\s*gì/,
    /bảo\s*hành/, /đổi\s*trả/, /freeship/, /ship\s*bao\s*lâu/,
    /có\s*mấy\s*loại/, /có\s*mấy\s*màu/,
    // ── Enhanced Vietnamese patterns ──
    /xài\s*(được|tốt|ok)/, /ngon\s*không/, /chất\s*(lượng|liệu)/,
    /có\s*bền/, /dùng\s*(được|lâu)/, /nguyên\s*liệu/,
    /hàng\s*(có|còn|xịn|fake|auth|real)/, /hạn\s*sử\s*dụng/,
    /thành\s*phần/, /xuất\s*xứ/, /hàng\s*(việt|trung|nội)/,
    /loại\s*nào/, /cái\s*nào/, /có\s*size/, /có\s*màu/,
    /có\s*(lớn|nhỏ|vừa)/, /mẫu\s*mới/, /deal|combo|khuyến\s*mãi/,
  ]

  for (const p of hotPatterns) {
    if (p.test(lower)) {
      return { label: 'HOT', summary: 'Keyword match: buying intent', product_intent: '' }
    }
  }
  for (const p of warmPatterns) {
    if (p.test(lower)) {
      return { label: 'WARM', summary: 'Keyword match: interested', product_intent: '' }
    }
  }

  return { label: 'COLD', summary: 'No buying signal', product_intent: '' }
}

export async function isConfigured(): Promise<boolean> {
  return !!GEMINI_API_KEY
}
