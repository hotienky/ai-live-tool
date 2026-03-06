const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const REPLY_PROMPT = `Bạn là nhân viên tư vấn bán hàng thân thiện, chuyên nghiệp cho một cửa hàng Livestream. 
Nhiệm vụ: Soạn câu trả lời ngắn gọn (dưới 100 từ) cho bình luận của khách hàng.

Yêu cầu:
- Giọng điệu: thân thiện, nhiệt tình, gần gũi
- Luôn cảm ơn khách đã quan tâm
- Nếu khách hỏi giá → mời inbox hoặc check link sản phẩm
- Nếu khách chốt đơn → xác nhận thông tin + hẹn ship sớm
- Nếu khách hỏi tư vấn → tư vấn ngắn gọn, chuyên nghiệp
- Dùng emoji phù hợp (1-2 emoji, không quá nhiều)
- Sử dụng tiếng Việt tự nhiên`;

const replyModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: REPLY_PROMPT,
});

// Cache để tránh duplicate API calls
const replyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

/**
 * Generate AI reply for a comment
 * @param {string} comment - Nội dung bình luận gốc
 * @param {string} label - [HOT], [WARM], [COLD]
 * @param {string} nickname - Tên khách
 * @returns {Promise<string>} - Câu trả lời gợi ý
 */
async function generateReply(comment, label = "[WARM]", nickname = "bạn") {
  // Check cache
  const cacheKey = comment.substring(0, 50).toLowerCase();
  const cached = replyCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.reply;
  }

  try {
    const prompt = `Khách "${nickname}" bình luận (${label}): "${comment}"
Soạn câu trả lời:`;

    const result = await replyModel.generateContent(prompt);
    const reply = result.response.text().trim();

    // Cache
    replyCache.set(cacheKey, { reply, time: Date.now() });

    // Cleanup old cache
    if (replyCache.size > 200) {
      const now = Date.now();
      for (const [key, val] of replyCache) {
        if (now - val.time > CACHE_TTL) replyCache.delete(key);
      }
    }

    return reply;
  } catch (error) {
    console.error("❌ Reply AI Error:", error.message);
    // Fallback replies
    if (label === "[HOT]") {
      return `Dạ cảm ơn ${nickname} đã quan tâm ạ! Em ghi nhận đơn cho mình ngay nhé. Mình inbox em thông tin ship ạ 📦`;
    }
    return `Dạ cảm ơn ${nickname} ạ! Mình inbox em chi tiết nhé ❤️`;
  }
}

/**
 * Sentiment analysis cho batch comments
 */
async function analyzeSentiment(comments) {
  if (!comments || comments.length === 0) {
    return { score: 0, mood: "neutral", summary: "" };
  }

  try {
    const batch = comments.slice(-20).map((c) => c.comment || c).join("\n");
    const prompt = `Phân tích cảm xúc tổng thể của các bình luận Livestream sau.
Trả về JSON format: {"score": <số từ -1 đến 1>, "mood": "<positive|neutral|negative>", "summary": "<tóm tắt 1 câu>"}

Bình luận:
${batch}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { score: 0, mood: "neutral", summary: text };
  } catch (error) {
    console.error("❌ Sentiment API Error:", error.message);
    return { score: 0, mood: "neutral", summary: "Không thể phân tích" };
  }
}

module.exports = { generateReply, analyzeSentiment };
