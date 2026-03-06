/**
 * ConnectorFactory — Tạo connector phù hợp dựa trên platform
 */
const TikTokConnector = require("./tiktokConnector");
const ShopeeConnector = require("./shopeeConnector");
const FacebookConnector = require("./facebookConnector");
const YouTubeConnector = require("./youtubeConnector");

/**
 * Tạo connector cho platform cụ thể
 * @param {string} platform - "tiktok" | "shopee" | "facebook" | "youtube"
 * @param {object} config - { username, shopee_id, facebook_page_id, youtube_channel_id, ... }
 * @returns {BaseConnector}
 */
function createConnector(platform, config) {
  switch (platform?.toLowerCase()) {
    case "tiktok":
      return new TikTokConnector(config.tiktok_username || config.username);
    case "shopee":
      return new ShopeeConnector(config);
    case "facebook":
      return new FacebookConnector(config);
    case "youtube":
      return new YouTubeConnector(config);
    default:
      throw new Error(`Platform "${platform}" không được hỗ trợ. Dùng: tiktok, shopee, facebook, youtube`);
  }
}

/**
 * Danh sách platforms được hỗ trợ
 */
const SUPPORTED_PLATFORMS = [
  { id: "tiktok", name: "TikTok Live", icon: "🎵", configField: "tiktok_username" },
  { id: "shopee", name: "Shopee Live", icon: "🛒", configField: "shopee_id" },
  { id: "facebook", name: "Facebook Live", icon: "📘", configField: "facebook_page_id" },
  { id: "youtube", name: "YouTube Live", icon: "🎬", configField: "youtube_channel_id" },
];

module.exports = { createConnector, SUPPORTED_PLATFORMS };
