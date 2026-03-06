const { WebcastPushConnection } = require("tiktok-live-connector");
const { analyzeComment } = require("./ai_service");

/**
 * ConnectionManager - Quản lý nhiều kết nối TikTok/Shopee đồng thời
 * Mỗi shop có 1 connection riêng, comments được emit vào Socket.io room của shop đó
 */
class ConnectionManager {
  constructor() {
    // Map<shopId, { connection, stats, username, status }>
    this.connections = new Map();
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
   * Kết nối TikTok Live cho 1 shop
   * @param {object} shop - Shop object từ DB { id, shop_name, tiktok_username }
   * @param {object} io - Socket.io server
   */
  async startConnection(shop, io) {
    const { id: shopId, tiktok_username: username, shop_name: shopName } = shop;

    if (!username) {
      throw new Error(`Shop "${shopName}" chưa cấu hình TikTok username`);
    }

    // Ngắt kết nối cũ nếu có
    if (this.connections.has(shopId)) {
      this.stopConnection(shopId);
    }

    const stats = { hot: 0, warm: 0, cold: 0, total: 0, startTime: new Date().toISOString() };
    const connInfo = {
      connection: null,
      stats,
      username,
      shopName,
      status: "connecting",
    };
    this.connections.set(shopId, connInfo);

    console.log(`🎬 [${shopName}] Đang kết nối TikTok @${username}...`);

    try {
      const tiktokConn = new WebcastPushConnection(username);
      connInfo.connection = tiktokConn;

      const state = await tiktokConn.connect();
      connInfo.status = "connected";

      console.log(`✅ [${shopName}] TikTok Live connected! Room: ${state.roomId}, Viewers: ${state.viewerCount}`);

      // Emit status to shop room
      io.to(`shop_${shopId}`).emit("crawler_status", {
        status: "connected",
        username,
        shopName,
      });

      // Chat listener
      tiktokConn.on("chat", async (data) => {
        try {
          const label = await analyzeComment(data.comment);
          const profileLink = `https://www.tiktok.com/@${data.uniqueId}`;

          const commentData = {
            id: `tt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            shopId,
            platform: "tiktok",
            nickname: data.nickname,
            uniqueId: data.uniqueId,
            comment: data.comment,
            label,
            profileLink,
            profilePictureUrl: data.profilePictureUrl,
            timestamp: new Date().toISOString(),
          };

          // Update shop stats
          if (label === "[HOT]") stats.hot++;
          else if (label === "[WARM]") stats.warm++;
          else stats.cold++;
          stats.total++;

          // Emit chỉ vào room của shop này
          io.to(`shop_${shopId}`).emit("new_comment", commentData);
          io.to(`shop_${shopId}`).emit("stats_update", { ...stats });

          const icon = label === "[HOT]" ? "🔥" : label === "[WARM]" ? "🟠" : "⚪";
          console.log(`${icon} [${shopName}] ${label} @${data.uniqueId}: ${data.comment.substring(0, 50)}`);
        } catch (err) {
          console.error(`❌ [${shopName}] Error processing comment:`, err.message);
        }
      });

      // Viewer count
      tiktokConn.on("roomUser", (data) => {
        io.to(`shop_${shopId}`).emit("viewer_count", { count: data.viewerCount });
      });

      // Disconnect
      tiktokConn.on("disconnected", () => {
        connInfo.status = "disconnected";
        console.log(`⚠️ [${shopName}] TikTok Live ngắt kết nối`);
        io.to(`shop_${shopId}`).emit("crawler_status", { status: "disconnected" });
      });

      return { success: true, roomId: state.roomId, viewers: state.viewerCount };
    } catch (err) {
      connInfo.status = "error";
      console.error(`❌ [${shopName}] Không thể kết nối TikTok @${username}:`, err.message);
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

      if (commentData.label === "[HOT]") stats.hot++;
      else if (commentData.label === "[WARM]") stats.warm++;
      else stats.cold++;
      stats.total++;

      io.to(`shop_${shopId}`).emit("new_comment", commentData);
      io.to(`shop_${shopId}`).emit("stats_update", { ...stats });

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
