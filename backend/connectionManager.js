const { WebcastPushConnection } = require("tiktok-live-connector");
const { analyzeComment } = require("./ai_service");
const { sendHotLeadAlert } = require("./telegramService");
const { createConnector, SUPPORTED_PLATFORMS } = require("./connectors");

/**
 * ConnectionManager - Quản lý nhiều kết nối TikTok/Shopee đồng thời
 * Mỗi shop có 1 connection riêng, comments được emit vào Socket.io room của shop đó
 */
class ConnectionManager {
  constructor() {
    // Map<shopId, { connection, stats, username, status }>
    this.connections = new Map();
    // Map<shopId, commentData[]> — in-memory lead storage for export
    this.leads = new Map();
  }

  /**
   * Lấy stats của 1 shop
   */
  getStats(shopId) {
    const conn = this.connections.get(shopId);
    if (!conn) return { hot: 0, warm: 0, cold: 0, total: 0 };
    return { ...conn.stats };
  }

  /**
   * Lấy trạng thái tất cả connections
   */
  getAllStatus() {
    const result = {};
    for (const [shopId, conn] of this.connections) {
      result[shopId] = {
        username: conn.username,
        status: conn.status,
        stats: { ...conn.stats },
      };
    }
    return result;
  }

  /**
   * Kết nối Live cho 1 shop — hỗ trợ multi-platform
   * @param {object} shop - Shop object { id, shop_name, platform, tiktok_username, ... }
   * @param {object} io - Socket.io server
   */
  async startConnection(shop, io) {
    const { id: shopId, shop_name: shopName, platform = "tiktok" } = shop;

    // Ngắt kết nối cũ nếu có
    if (this.connections.has(shopId)) {
      this.stopConnection(shopId);
    }

    const stats = { hot: 0, warm: 0, cold: 0, total: 0, startTime: new Date().toISOString() };
    const connInfo = {
      connection: null,
      stats,
      shopName,
      platform,
      status: "connecting",
    };
    this.connections.set(shopId, connInfo);

    const platformIcons = { tiktok: "🎵", shopee: "🛒", facebook: "📘", youtube: "🎬" };
    const icon = platformIcons[platform] || "📡";

    console.log(`${icon} [${shopName}] Đang kết nối ${platform}...`);

    try {
      const connector = createConnector(platform, shop);
      connInfo.connection = connector;

      const state = await connector.connect();
      connInfo.status = "connected";

      console.log(`✅ [${shopName}] ${platform} Live connected! Room: ${state.roomId}, Viewers: ${state.viewerCount}`);

      io.to(`shop_${shopId}`).emit("crawler_status", {
        status: "connected",
        platform,
        shopName,
      });

      // Profile link builders
      const profileLinkBuilders = {
        tiktok: (uid) => `https://www.tiktok.com/@${uid}`,
        shopee: (uid) => `https://shopee.vn/shop/${uid}`,
        facebook: (uid) => `https://www.facebook.com/${uid}`,
        youtube: (uid) => `https://www.youtube.com/@${uid}`,
      };
      const buildLink = profileLinkBuilders[platform] || ((uid) => `#${uid}`);

      // Chat listener
      connector.on("chat", async (data) => {
        try {
          const label = await analyzeComment(data.comment);
          const commentData = {
            id: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            shopId,
            platform,
            nickname: data.nickname,
            uniqueId: data.uniqueId,
            comment: data.comment,
            label,
            profileLink: buildLink(data.uniqueId),
            profilePictureUrl: data.profilePictureUrl,
            timestamp: new Date().toISOString(),
          };

          if (label === "[HOT]") { stats.hot++; sendHotLeadAlert(commentData, shopName); }
          else if (label === "[WARM]") stats.warm++;
          else stats.cold++;
          stats.total++;

          io.to(`shop_${shopId}`).emit("new_comment", commentData);
          io.to(`shop_${shopId}`).emit("stats_update", { ...stats });

          if (!this.leads.has(shopId)) this.leads.set(shopId, []);
          this.leads.get(shopId).push(commentData);

          const labelIcon = label === "[HOT]" ? "🔥" : label === "[WARM]" ? "🟠" : "⚪";
          console.log(`${labelIcon} [${shopName}] ${label} @${data.uniqueId}: ${data.comment.substring(0, 50)}`);
        } catch (err) {
          console.error(`❌ [${shopName}] Error processing comment:`, err.message);
        }
      });

      // Viewer count
      connector.on("roomUser", (data) => {
        io.to(`shop_${shopId}`).emit("viewer_count", { count: data.viewerCount });
      });

      // Disconnect
      connector.on("disconnected", () => {
        connInfo.status = "disconnected";
        console.log(`⚠️ [${shopName}] ${platform} Live ngắt kết nối`);
        io.to(`shop_${shopId}`).emit("crawler_status", { status: "disconnected" });
      });

      return { success: true, roomId: state.roomId, viewers: state.viewerCount };
    } catch (err) {
      connInfo.status = "error";
      console.error(`❌ [${shopName}] Không thể kết nối ${platform}:`, err.message);
      io.to(`shop_${shopId}`).emit("crawler_status", {
        status: "error",
        message: err.message,
      });
      throw err;
    }
  }

  /**
   * Chạy Mock mode cho 1 shop
   */
  startMockConnection(shop, io) {
    const { id: shopId, shop_name: shopName } = shop;

    // Ngắt cũ nếu có
    if (this.connections.has(shopId)) {
      this.stopConnection(shopId);
    }

    const { MOCK_COMMENTS, AVATARS } = require("./mock_service");
    const stats = { hot: 0, warm: 0, cold: 0, total: 0, startTime: new Date().toISOString() };
    let commentIndex = 0;

    const interval = setInterval(() => {
      const mockData = MOCK_COMMENTS[commentIndex % MOCK_COMMENTS.length];
      const avatarUrl = AVATARS[commentIndex % AVATARS.length];

      const commentData = {
        id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        shopId,
        platform: "mock",
        nickname: mockData.nickname,
        uniqueId: mockData.uniqueId,
        comment: mockData.comment,
        label: mockData.expectedLabel,
        profileLink: `https://www.tiktok.com/@${mockData.uniqueId}`,
        profilePictureUrl: avatarUrl,
        timestamp: new Date().toISOString(),
      };

      if (commentData.label === "[HOT]") {
        stats.hot++;
        sendHotLeadAlert(commentData, shopName);
      } else if (commentData.label === "[WARM]") stats.warm++;
      else stats.cold++;
      stats.total++;

      io.to(`shop_${shopId}`).emit("new_comment", commentData);
      io.to(`shop_${shopId}`).emit("stats_update", { ...stats });

      // Lưu lead cho export
      if (!this.leads.has(shopId)) this.leads.set(shopId, []);
      this.leads.get(shopId).push(commentData);

      commentIndex++;
    }, 2000 + Math.random() * 2000);

    // Mock viewer count (fluctuating)
    let mockViewers = Math.floor(800 + Math.random() * 2200);
    const viewerInterval = setInterval(() => {
      mockViewers += Math.floor(Math.random() * 200 - 80); // ±fluctuation
      mockViewers = Math.max(100, mockViewers);
      io.to(`shop_${shopId}`).emit("viewer_count", { count: mockViewers });
    }, 5000);

    this.connections.set(shopId, {
      connection: null,
      mockInterval: interval,
      viewerInterval,
      stats,
      username: "mock",
      shopName,
      status: "mock",
    });

    io.to(`shop_${shopId}`).emit("crawler_status", {
      status: "mock",
      shopName,
    });

    // Emit initial viewer count
    io.to(`shop_${shopId}`).emit("viewer_count", { count: mockViewers });

    console.log(`🎭 [${shopName}] Mock mode started`);
    return { success: true };
  }

  /**
   * Ngắt kết nối 1 shop
   */
  stopConnection(shopId) {
    const conn = this.connections.get(shopId);
    if (!conn) return;

    if (conn.connection) {
      conn.connection.disconnect();
    }
    if (conn.mockInterval) {
      clearInterval(conn.mockInterval);
    }
    if (conn.viewerInterval) {
      clearInterval(conn.viewerInterval);
    }

    console.log(`🛑 [${conn.shopName}] Connection stopped`);
    this.connections.delete(shopId);
  }

  /**
   * Ngắt tất cả (graceful shutdown)
   */
  stopAll() {
    for (const [shopId] of this.connections) {
      this.stopConnection(shopId);
    }
    console.log("🛑 All connections stopped");
  }

  /**
   * Kiểm tra shop đang kết nối không
   */
  isConnected(shopId) {
    const conn = this.connections.get(shopId);
    return conn ? conn.status : null;
  }
}

module.exports = new ConnectionManager();
