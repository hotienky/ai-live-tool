/**
 * Telegram Service — Alert khi có HOT lead
 */
import env from '#start/env'

const BOT_TOKEN = env.get('TELEGRAM_BOT_TOKEN', '')
const CHAT_ID = env.get('TELEGRAM_CHAT_ID', '')

export function isConfigured(): boolean {
  return !!(BOT_TOKEN && CHAT_ID)
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
}

export async function sendHotLeadAlert(lead: any, shopName: string) {
  if (!BOT_TOKEN || !CHAT_ID) return

  const message = `
🔥 *LEAD HOT — ${shopName}*

👤 *${lead.nickname}* (@${lead.uniqueId})
💬 _"${escapeMarkdown(lead.comment)}"_

🔗 [Xem Profile](${lead.profileLink})
🕐 ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
  `.trim()

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
  } catch (err: any) {
    console.error('❌ Telegram error:', err.message)
  }
}

export async function sendSessionSummary(shopName: string, stats: any, duration: string) {
  if (!BOT_TOKEN || !CHAT_ID) return

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
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' }),
    })
  } catch (err: any) {
    console.error('❌ Telegram summary error:', err.message)
  }
}
