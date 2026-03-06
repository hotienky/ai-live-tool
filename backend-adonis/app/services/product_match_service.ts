/**
 * Product Match Service — AI mapping comment → sản phẩm
 */
import env from '#start/env'
import aiQueue from '#services/ai_queue'

export async function matchProduct(comment: string, products: any[] = []): Promise<any | null> {
  if (!comment || products.length === 0) return null

  const lower = comment.toLowerCase()

  // 1. Keyword matching (fast, no AI cost)
  for (const product of products) {
    const keywords: string[] = product.keywords ? (typeof product.keywords === 'string' ? product.keywords.split(',') : product.keywords) : []
    for (const kw of keywords) {
      if (kw && lower.includes(kw.trim().toLowerCase())) {
        return {
          product: { id: product.id, name: product.name, price: product.price, image_url: product.imageUrl || product.image_url },
          confidence: 0.9,
          matchType: 'keyword',
          matchedKeyword: kw,
        }
      }
    }

    // Name matching
    if (product.name && lower.includes(product.name.toLowerCase())) {
      return {
        product: { id: product.id, name: product.name, price: product.price, image_url: product.imageUrl || product.image_url },
        confidence: 0.85,
        matchType: 'name',
      }
    }
  }

  // 2. AI matching (more expensive but smarter)
  if (comment.length < 10) return null

  const GEMINI_KEY = env.get('GEMINI_API_KEY', '')
  if (!GEMINI_KEY) return null

  try {
    return await aiQueue.enqueue(async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(GEMINI_KEY)

      const productList = products
        .map((p, i) => `[${i + 1}] ${p.name} (${p.price?.toLocaleString()}đ) - Keywords: ${typeof p.keywords === 'string' ? p.keywords : (p.keywords || []).join(', ')}`)
        .join('\n')

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const prompt = `Bạn là AI hỗ trợ livestream bán hàng. Xác định bình luận sau đang hỏi về sản phẩm nào.

Danh sách sản phẩm:
${productList}

Bình luận: "${comment}"

Trả về JSON: {"index": <số thứ tự sản phẩm hoặc 0 nếu không match>, "confidence": <0.0-1.0>}
Chỉ trả JSON, không giải thích.`

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.index > 0 && parsed.index <= products.length && parsed.confidence > 0.5) {
          const matched = products[parsed.index - 1]
          return {
            product: { id: matched.id, name: matched.name, price: matched.price, image_url: matched.imageUrl || matched.image_url },
            confidence: parsed.confidence,
            matchType: 'ai',
          }
        }
      }
      return null
    }, null)
  } catch {
    return null
  }
}
