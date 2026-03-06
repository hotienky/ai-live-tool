/**
 * Product Match Service — AI mapping comment → sản phẩm
 * Giúp livestreamer biết khách đang hỏi sản phẩm nào
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const aiQueue = require("./aiQueue");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * So khớp comment với danh sách sản phẩm
 * Ưu tiên keyword matching trước, AI fallback sau
 * @param {string} comment - Nội dung bình luận
 * @param {Array} products - Danh sách sản phẩm [{name, price, keywords, image_url}]
 * @returns {object|null} - { product, confidence, matchType }
 */
async function matchProduct(comment, products = []) {
  if (!comment || products.length === 0) return null;

  const lower = comment.toLowerCase();

  // 1. Keyword matching (fast, no AI cost)
  for (const product of products) {
    const keywords = product.keywords || [];
    for (const kw of keywords) {
      if (kw && lower.includes(kw.toLowerCase())) {
        return {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
          },
          confidence: 0.9,
          matchType: "keyword",
          matchedKeyword: kw,
        };
      }
    }

    // Name matching
    if (product.name && lower.includes(product.name.toLowerCase())) {
      return {
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        },
        confidence: 0.85,
        matchType: "name",
      };
    }
  }

  // 2. AI matching (more expensive but smarter)
  // Chỉ dùng AI khi comment dài hơn 10 ký tự và không match keyword
  if (comment.length < 10) return null;

  try {
    return await aiQueue.enqueue(async () => {
      const productList = products
        .map((p, i) => `[${i + 1}] ${p.name} (${p.price?.toLocaleString()}đ) - Keywords: ${(p.keywords || []).join(", ")}`)
        .join("\n");

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Bạn là AI hỗ trợ livestream bán hàng. Xác định bình luận sau đang hỏi về sản phẩm nào.

Danh sách sản phẩm:
${productList}

Bình luận: "${comment}"

Trả về JSON: {"index": <số thứ tự sản phẩm hoặc 0 nếu không match>, "confidence": <0.0-1.0>}
Chỉ trả JSON, không giải thích.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.index > 0 && parsed.index <= products.length && parsed.confidence > 0.5) {
          const matched = products[parsed.index - 1];
          return {
            product: {
              id: matched.id,
              name: matched.name,
              price: matched.price,
              image_url: matched.image_url,
            },
            confidence: parsed.confidence,
            matchType: "ai",
          };
        }
      }
      return null;
    }, null);
  } catch (err) {
    // Silent fail — product matching is optional
    return null;
  }
}

module.exports = { matchProduct };
