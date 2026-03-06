const axios = require("axios");
require("dotenv").config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Gửi thông báo Telegram khi có lead HOT
 * @param {object} lead - Comment data
 * @param {string} shopName - Tên shop
 */
async function sendHotLeadAlert(lead, shopName) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const message = `
🔥 *LEAD HOT — ${shopName}*

👤 *${lead.nickname}* (@${lead.uniqueId})
💬 _"${escapeMarkdown(lead.comment)}"_

🔗 [Xem Profile](${lead.profileLink})
🕐 ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
  `.trim();

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error("❌ Telegram error:", err.response?.data?.description || err.message);
  }
}

/**
 * Gửi summary thống kê sau khi livestream kết thúc
 */
async function sendSessionSummary(shopName, stats, duration) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const message = `
📊 *TỔNG KẾT LIVE — ${shopName}*

🔥 HOT: ${stats.hot}
🟠 WARM: ${stats.warm}
⚪ COLD: ${stats.cold}
📝 Tổng: ${stats.total}
⏱️ Thời lượng: ${duration}
📈 Tỷ lệ tiềm năng: ${stats.total > 0 ? Math.round(((stats.hot + stats.warm) / stats.total) * 100) : 0}%
  `.trim();

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("❌ Telegram summary error:", err.message);
  }
}

/**
 * Escape special Markdown chars
 */
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

/**
 * Kiểm tra bot token hợp lệ
 */
function isConfigured() {
  return !!(BOT_TOKEN && CHAT_ID);
}

module.exports = { sendHotLeadAlert, sendSessionSummary, isConfigured };
