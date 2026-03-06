/**
 * Reply Service — AI auto-reply generation + sentiment analysis
 */
import env from '#start/env'

const GEMINI_KEY = env.get('GEMINI_API_KEY', '')
const replyCache = new Map<string, { reply: string; time: number }>()
const CACHE_TTL = 5 * 60 * 1000

export async function generateReply(comment: string, label: string = '[WARM]', nickname: string = 'bạn'): Promise<string> {
  const cacheKey = comment.substring(0, 50).toLowerCase()
  const cached = replyCache.get(cacheKey)
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.reply

  if (!GEMINI_KEY) {
    return label === '[HOT]'
      ? `Dạ cảm ơn ${nickname} đã quan tâm ạ! Em ghi nhận đơn cho mình ngay nhé. Mình inbox em thông tin ship ạ 📦`
      : `Dạ cảm ơn ${nickname} ạ! Mình inbox em chi tiết nhé ❤️`
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(GEMINI_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `Bạn là nhân viên tư vấn bán hàng thân thiện, chuyên nghiệp cho một cửa hàng Livestream. 
Nhiệm vụ: Soạn câu trả lời ngắn gọn (dưới 100 từ) cho bình luận của khách hàng.
Yêu cầu:
- Giọng điệu: thân thiện, nhiệt tình, gần gũi
- Luôn cảm ơn khách đã quan tâm
- Nếu khách hỏi giá → mời inbox hoặc check link sản phẩm
- Nếu khách chốt đơn → xác nhận thông tin + hẹn ship sớm
- Nếu khách hỏi tư vấn → tư vấn ngắn gọn, chuyên nghiệp
- Dùng emoji phù hợp (1-2 emoji, không quá nhiều)
- Sử dụng tiếng Việt tự nhiên`,
    })

    const prompt = `Khách "${nickname}" bình luận (${label}): "${comment}"\nSoạn câu trả lời:`
    const result = await model.generateContent(prompt)
    const reply = result.response.text().trim()

    replyCache.set(cacheKey, { reply, time: Date.now() })
    if (replyCache.size > 200) {
      const now = Date.now()
      for (const [key, val] of replyCache) {
        if (now - val.time > CACHE_TTL) replyCache.delete(key)
      }
    }

    return reply
  } catch (err: any) {
    console.error('❌ Reply AI Error:', err.message)
    return label === '[HOT]'
      ? `Dạ cảm ơn ${nickname} đã quan tâm ạ! Em ghi nhận đơn cho mình ngay nhé 📦`
      : `Dạ cảm ơn ${nickname} ạ! Mình inbox em chi tiết nhé ❤️`
  }
}

export async function analyzeSentiment(comments: any[]): Promise<{ score: number; mood: string; summary: string }> {
  if (!comments || comments.length === 0) return { score: 0, mood: 'neutral', summary: '' }
  if (!GEMINI_KEY) return { score: 0, mood: 'neutral', summary: 'AI unavailable' }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(GEMINI_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const batch = comments.slice(-20).map((c) => c.comment || c).join('\n')
    const prompt = `Phân tích cảm xúc tổng thể của các bình luận Livestream sau.
Trả về JSON format: {"score": <số từ -1 đến 1>, "mood": "<positive|neutral|negative>", "summary": "<tóm tắt 1 câu>"}

Bình luận:
${batch}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return { score: 0, mood: 'neutral', summary: text }
  } catch (err: any) {
    console.error('❌ Sentiment API Error:', err.message)
    return { score: 0, mood: 'neutral', summary: 'Không thể phân tích' }
  }
}
