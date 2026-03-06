/**
 * AI Service — Gemini API integration
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
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  return model
}

export async function analyzeComment(comment: string): Promise<{ label: string; summary: string; product_intent: string }> {
  const m = await getModel()
  if (!m) {
    return { label: 'COLD', summary: 'AI unavailable', product_intent: '' }
  }

  const prompt = `Analyze this livestream comment for buying intent.
Comment: "${comment}"

Respond in JSON: {"label":"HOT|WARM|COLD","summary":"brief reason","product_intent":"product if mentioned"}
- HOT = clearly wants to buy (asking price, how to order, "muốn mua", "ship cho em")
- WARM = interested but not committed (asking about product details, quality)
- COLD = just chatting, greeting, or unrelated`

  try {
    const result = await m.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return { label: 'COLD', summary: 'Parse error', product_intent: '' }
  } catch (err: any) {
    console.error('AI Error:', err.message)
    return { label: 'COLD', summary: 'AI error', product_intent: '' }
  }
}

export async function isConfigured(): Promise<boolean> {
  return !!GEMINI_API_KEY
}
