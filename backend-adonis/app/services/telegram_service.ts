/**
 * Telegram Service — Alert khi có HOT lead
 * P2 Fix: Per-shop config (fallback to global env vars)
 */
import env from '#start/env'

const GLOBAL_BOT_TOKEN = env.get('TELEGRAM_BOT_TOKEN', '')
const GLOBAL_CHAT_ID = env.get('TELEGRAM_CHAT_ID', '')

// P2: Shop-specific config, with fallback to global
interface TelegramConfig {
  telegramBotToken?: string
  telegramChatId?: string
}

function getConfig(shopConfig?: TelegramConfig) {
  return {
    botToken: shopConfig?.telegramBotToken || GLOBAL_BOT_TOKEN,
    chatId: shopConfig?.telegramChatId || GLOBAL_CHAT_ID,
  }
}

export function isConfigured(shopConfig?: TelegramConfig): boolean {
  const { botToken, chatId } = getConfig(shopConfig)
  return !!(botToken && chatId)
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
}

export async function sendHotLeadAlert(lead: any, shopName: string, shopConfig?: TelegramConfig) {
  const { botToken, chatId } = getConfig(shopConfig)
  if (!botToken || !chatId) return

  const message = `
🔥 *LEAD HOT — ${shopName}*

👤 *${lead.nickname}* (@${lead.uniqueId})
💬 _"${escapeMarkdown(lead.comment)}"_

🔗 [Xem Profile](${lead.profileLink})
🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
  `.trim()

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
  } catch (err: any) {
    console.error('❌ Telegram error:', err.message)
  }
}

export async function sendSessionSummary(shopName: string, stats: any, duration: string, shopConfig?: TelegramConfig) {
  const { botToken, chatId } = getConfig(shopConfig)
  if (!botToken || !chatId) return

  const message = `
📊 *TỔNG KẾT LIVE — ${shopName}*

🔥 HOT: ${stats.hot}
🟠 WARM: ${stats.warm}
⚪ COLD: ${stats.cold}
📝 Tổng: ${stats.total}
⏱️ Thời lượng: ${duration}
📈 Tỷ lệ tiềm năng: ${stats.total > 0 ? Math.round(((stats.hot + stats.warm) / stats.total) * 100) : 0}%
  `.trim()

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
    })
  } catch (err: any) {
    console.error('❌ Telegram summary error:', err.message)
  }
}

