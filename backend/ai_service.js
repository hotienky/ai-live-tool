const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const aiQueue = require("./aiQueue");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Bạn là trợ lý AI phân tích bình luận Livestream bán hàng chuyên nghiệp, áp dụng cho mọi ngành hàng (Mẹ & Bé, Thời trang, Mỹ phẩm, Thực phẩm, Đồ gia dụng, Điện tử, v.v.).

Nhiệm vụ: Đọc từng bình luận và phân loại tiềm năng mua hàng. Chỉ trả về đúng 1 từ khóa: [HOT], [WARM], hoặc [COLD]. Không giải thích.

═══ [HOT] - Khách có ý định mua rõ ràng ═══
• Chứa số điện thoại (09x, 03x, 07x, 08x, 05x...) hoặc yêu cầu liên hệ
• Cú pháp chốt đơn: chốt, đặt, mua, lấy, order, book, đăng ký, ghi danh
• Yêu cầu thanh toán: chuyển khoản, CK, STK, banking, momo, zalopay, COD
• Giục giao hàng: ship, giao nhanh, bao giờ giao, nhận hàng, giao tận nơi
• Chốt số lượng: "lấy 2 cái", "cho 1 hộp", "mình 3 bộ", kèm số lượng cụ thể
• Xác nhận địa chỉ: ghi address, quận/huyện, gửi về..., ship về...
• Hỏi tồn kho: còn hàng không, hết chưa, restock khi nào
• Khẩn cấp: inbox mình, nhắn tin, DM, PM, ib
• Combo/deal: "lấy combo", "mua kèm", "bundle"

═══ [WARM] - Khách quan tâm, đang tìm hiểu ═══
• Hỏi giá/chi phí: giá, bao nhiêu, bn, bnh, how much, giá sỉ, giá lẻ, sale, giảm giá, khuyến mãi, voucher, mã giảm
• Hỏi tính năng: chất liệu, thành phần, công dụng, tác dụng, ingredients
• Hỏi tư vấn: size, cân nặng, tháng tuổi, dùng cho bé, da dầu, da khô
• So sánh: khác gì, nào tốt hơn, so với, review, đánh giá, feedback
• Hỏi cách dùng: hướng dẫn, cách dùng, sử dụng, bảo quản, hạn dùng
• Hỏi chính sách: bảo hành, đổi trả, hoàn tiền, exchange, return
• Hỏi màu/loại: có màu gì, mấy loại, variant, option
• Hỏi nguồn gốc: hàng auth, chính hãng, fake, rep, xuất xứ, origin
• Thể hiện quan tâm: thích quá, đẹp quá, muốn mua, cần, want, interested
• Hỏi phí ship: ship bn, phí ship, freeship, free ship

═══ [COLD] - Không liên quan mua bán ═══
• Chào hỏi: hello, hi, xin chào
• Khen/chê chung chung: đẹp, xinh, giỏi, pro, hay quá (không kèm ý mua)
• Thả icon/emoji đơn thuần: 🔥❤️👍😍🎉
• Hỏi chuyện cá nhân, spam, quảng cáo link khác
• Comment 1-2 từ không rõ ý: ok, ừ, haha, lol, @@`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: SYSTEM_PROMPT,
});

/**
 * Phân loại một comment đơn lẻ
 * @param {string} text - Nội dung bình luận
 * @returns {Promise<string>} - [HOT], [WARM], hoặc [COLD]
 */
async function analyzeComment(text) {
  return aiQueue.enqueue(async () => {
    try {
      const result = await model.generateContent(text);
      const response = result.response.text().trim();

      if (response.includes("[HOT]")) return "[HOT]";
      if (response.includes("[WARM]")) return "[WARM]";
      return "[COLD]";
    } catch (error) {
      console.error("❌ Gemini API Error:", error.message);
      return fallbackClassify(text);
    }
  }, fallbackClassify(text));
}

/**
 * Phân loại hàng loạt (batch) để tối ưu API calls
 */
async function analyzeCommentsBatch(comments) {
  if (comments.length === 0) return [];

  const batchPrompt = comments.map((c, i) => `[${i + 1}] ${c.text}`).join("\n");

  const batchInstruction = `Phân loại từng bình luận sau đây. Trả về kết quả theo format:
[số thứ tự] [LABEL]
Ví dụ:
[1] [HOT]
[2] [COLD]

Danh sách bình luận:
${batchPrompt}`;

  try {
    const result = await model.generateContent(batchInstruction);
    const response = result.response.text().trim();
    const lines = response.split("\n");

    return comments.map((comment, i) => {
      const line = lines[i] || "";
      let label = "[COLD]";
      if (line.includes("[HOT]")) label = "[HOT]";
      else if (line.includes("[WARM]")) label = "[WARM]";
      return { id: comment.id, label };
    });
  } catch (error) {
    console.error("❌ Gemini Batch API Error:", error.message);
    return comments.map((c) => ({
      id: c.id,
      label: fallbackClassify(c.text),
    }));
  }
}

/**
 * Fallback classifier khi API lỗi - dùng regex mở rộng
 */
function fallbackClassify(text) {
  const lower = text.toLowerCase();

  // ── HOT keywords ──────────────────────────────────
  const hotKeywords = [
    // Số điện thoại VN
    /0\d{9,10}/,
    /\d{4,}/,
    // Chốt đơn
    /chốt/i, /đặt\s*(hàng|đơn|mua|cho|giúp|dùm|luôn)?/i,
    /mua\s*(luôn|ngay|liền|cho|giúp|dùm)?/i,
    /lấy\s*(cho|giúp|dùm|luôn|\d+)?/i,
    /order/i, /book/i, /đăng\s*ký/i,
    // Thanh toán
    /thanh\s*toán/i, /chuyển\s*khoản/i, /\bck\b/i, /\bstk\b/i,
    /banking/i, /momo/i, /zalopay/i, /\bcod\b/i, /tiền\s*mặt/i,
    // Giao hàng
    /ship\s*(cho|về|tới|đến|nhanh|giúp|dùm)?/i,
    /giao\s*(hàng|nhanh|tận|về|cho|giúp)?/i,
    /nhận\s*hàng/i, /bao\s*giờ\s*giao/i,
    // Xác nhận
    /inbox/i, /\bib\b/i, /\bdm\b/i, /\bpm\b/i, /nhắn\s*tin/i,
    // Tồn kho
    /còn\s*(hàng|không|ko|k)/i, /hết\s*(chưa|hàng|chưa)/i,
    // Số lượng
    /\d+\s*(cái|bộ|hộp|chai|lọ|gói|túi|đôi|chiếc|bình|set|combo)/i,
    /cho\s*mình\s*\d+/i, /lấy\s*\d+/i, /mình\s*\d+/i,
    // Combo
    /combo/i, /bundle/i, /mua\s*kèm/i,
    // Địa chỉ
    /quận/i, /huyện/i, /phường/i, /gửi\s*về/i, /ship\s*về/i,
    /tỉnh/i, /thành\s*phố/i, /tp\./i,
  ];

  // ── WARM keywords ─────────────────────────────────
  const warmKeywords = [
    // Giá cả
    /giá/i, /bao\s*nhiêu/i, /\bbn\b/i, /\bbnh\b/i, /how\s*much/i,
    /giá\s*sỉ/i, /giá\s*lẻ/i, /giá\s*bán/i,
    // Sale/Khuyến mãi
    /sale/i, /giảm\s*giá/i, /khuyến\s*mãi/i, /\bkm\b/i,
    /voucher/i, /mã\s*giảm/i, /coupon/i, /discount/i,
    /flash\s*sale/i, /deal/i,
    // Tính năng sản phẩm
    /chất\s*liệu/i, /thành\s*phần/i, /công\s*dụng/i, /tác\s*dụng/i,
    /ingredients/i, /material/i, /fabric/i,
    // Tư vấn
    /size/i, /cân\s*nặng/i, /tháng\s*tuổi/i, /tuổi/i,
    /da\s*(dầu|khô|nhạy|hỗn|thường)/i,
    /phù\s*hợp/i, /hợp\s*(với|cho)/i,
    /dùng\s*(cho|được|có)/i,
    // So sánh
    /khác\s*gì/i, /nào\s*tốt/i, /so\s*với/i,
    /review/i, /đánh\s*giá/i, /feedback/i,
    // Cách dùng
    /cách\s*dùng/i, /hướng\s*dẫn/i, /sử\s*dụng/i,
    /bảo\s*quản/i, /hạn\s*dùng/i, /hạn\s*sử\s*dụng/i,
    // Chính sách
    /bảo\s*hành/i, /đổi\s*trả/i, /hoàn\s*tiền/i, /return/i, /exchange/i,
    // Variant
    /có\s*màu/i, /mấy\s*loại/i, /mấy\s*màu/i, /bao\s*nhiêu\s*màu/i,
    /variant/i, /option/i,
    // Nguồn gốc
    /hàng\s*auth/i, /chính\s*hãng/i, /authentic/i, /original/i,
    /xuất\s*xứ/i, /origin/i, /fake/i, /\brep\b/i,
    // Quan tâm
    /thích\s*quá/i, /đẹp\s*quá/i, /muốn\s*mua/i, /cần/i,
    /want/i, /interested/i, /yêu\s*quá/i,
    // Phí ship
    /phí\s*ship/i, /ship\s*(bn|bao\s*nhiêu)/i, /freeship/i, /free\s*ship/i,
    // Tư vấn chung
    /tư\s*vấn/i, /loại\s*nào/i, /nên\s*dùng/i, /nên\s*mua/i,
    /recommend/i, /suggest/i,
  ];

  for (const kw of hotKeywords) {
    if (kw.test(text)) return "[HOT]";
  }
  for (const kw of warmKeywords) {
    if (kw.test(text)) return "[WARM]";
  }
  return "[COLD]";
}

module.exports = { analyzeComment, analyzeCommentsBatch, fallbackClassify };
