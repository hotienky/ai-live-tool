const { WebcastPushConnection } = require("tiktok-live-connector");
const { analyzeComment } = require("./ai_service");
const { sendHotLeadAlert } = require("./telegramService");
const { createConnector, SUPPORTED_PLATFORMS } = require("./connectors");
const { createSession, endSession } = require("./routes/sessionRoutes");
const { saveComment } = require("./db/models");
const { matchProduct } = require("./productMatchService");

/**
 * ConnectionManager - Quản lý nhiều kết nối TikTok/Shopee đồng thời
 * Mỗi shop có 1 connection riêng, comments được emit vào Socket.io room của shop đó
 */
class ConnectionManager {
  constructor() {
    this.connections = new Map();
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
      peakViewers: 0,
      sessionId: null,
      products: [], // Cached products for matching
      keywords: [], // Cached keywords for alerts
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

      // Lưu session vào DB
      try {
        const session = await createSession({
          shop_id: shopId,
          platform,
          platform_live_id: state.roomId || null,
          status: "Active",
          shop_name: shopName,
          started_at: new Date(),
        });
        connInfo.sessionId = session.id;
        console.log(`💾 [${shopName}] Session saved: ${session.id}`);
      } catch (e) {
        console.error(`⚠️ [${shopName}] Không thể lưu session:`, e.message);
      }

      // Load products for matching
      try {
        const { DB_ENABLED } = require("./db/connection");
        if (DB_ENABLED) {
          const { Product } = require("./db/models");
          if (Product) {
            const products = await Product.findAll({ where: { shop_id: shopId }, raw: true });
            connInfo.products = products;
            console.log(`📦 [${shopName}] Loaded ${products.length} products for matching`);
          }
        }
      } catch (e) {
        console.log(`⚠️ [${shopName}] Không load được products:`, e.message);
      }

      // Load keywords for alerts
      try {
        const { DB_ENABLED: dbOn } = require("./db/connection");
        if (dbOn) {
          const { ShopKeyword } = require("./db/models");
          if (ShopKeyword) {
            const keywords = await ShopKeyword.findAll({
              where: { shop_id: shopId, is_active: true },
              raw: true,
            });
            connInfo.keywords = keywords;
            console.log(`🔑 [${shopName}] Loaded ${keywords.length} keywords for alerts`);
          }
        }
      } catch (e) {
        console.log(`⚠️ [${shopName}] Không load được keywords:`, e.message);
      }

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

          // Product matching cho HOT/WARM
          if ((label === "[HOT]" || label === "[WARM]") && connInfo.products.length > 0) {
            try {
              const match = await matchProduct(data.comment, connInfo.products);
              if (match) commentData.matchedProduct = match;
            } catch (e) { /* silent */ }
          }

          // Keyword matching
          if (connInfo.keywords.length > 0) {
            const lower = data.comment.toLowerCase();
            const matched = connInfo.keywords.filter(kw => lower.includes(kw.keyword.toLowerCase()));
            if (matched.length > 0) {
              commentData.matchedKeywords = matched.map(kw => ({ keyword: kw.keyword, color: kw.color, alert_type: kw.alert_type }));
            }
          }

          io.to(`shop_${shopId}`).emit("new_comment", commentData);
          io.to(`shop_${shopId}`).emit("stats_update", { ...stats });

          if (!this.leads.has(shopId)) this.leads.set(shopId, []);
          this.leads.get(shopId).push(commentData);

          // Lưu vào DB (consolidated)
          saveComment(commentData, connInfo.sessionId);

          const labelIcon = label === "[HOT]" ? "🔥" : label === "[WARM]" ? "🟠" : "⚪";
          console.log(`${labelIcon} [${shopName}] ${label} @${data.uniqueId}: ${data.comment.substring(0, 50)}`);
        } catch (err) {
          console.error(`❌ [${shopName}] Error processing comment:`, err.message);
        }
      });

      // Viewer count
      connector.on("roomUser", (data) => {
        io.to(`shop_${shopId}`).emit("viewer_count", { count: data.viewerCount });
        // Track peak viewers
        if (data.viewerCount > connInfo.peakViewers) {
          connInfo.peakViewers = data.viewerCount;
        }
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
  async startMockConnection(shop, io) {
    const { id: shopId, shop_name: shopName } = shop;

    // Ngắt cũ nếu có
    if (this.connections.has(shopId)) {
      await this.stopConnection(shopId);
    }

    const { MOCK_COMMENTS, AVATARS } = require("./mock_service");
    const stats = { hot: 0, warm: 0, cold: 0, total: 0, startTime: new Date().toISOString() };
    let commentIndex = 0;

    // Mock viewer count
    let mockViewers = Math.floor(800 + Math.random() * 2200);
    let peakViewers = mockViewers;

    // ⚠️ FIX: Khai báo connInfo TRƯỚC setInterval để tránh reference error
    const connInfo = {
      connection: null,
      mockInterval: null,
      viewerInterval: null,
      stats,
      username: "mock",
      shopName,
      status: "mock",
      peakViewers,
      sessionId: null,
    };

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

      if (!this.leads.has(shopId)) this.leads.set(shopId, []);
      this.leads.get(shopId).push(commentData);

      // Lưu vào DB (consolidated)
      saveComment(commentData, connInfo.sessionId);

      commentIndex++;
    }, 2000 + Math.random() * 2000);

    const viewerInterval = setInterval(() => {
      mockViewers += Math.floor(Math.random() * 200 - 80);
      mockViewers = Math.max(100, mockViewers);
      if (mockViewers > peakViewers) peakViewers = mockViewers;
      connInfo.peakViewers = peakViewers;
      io.to(`shop_${shopId}`).emit("viewer_count", { count: mockViewers });
    }, 5000);

    connInfo.mockInterval = interval;
    connInfo.viewerInterval = viewerInterval;
    this.connections.set(shopId, connInfo);

    // Lưu session
    try {
      const session = await createSession({
        shop_id: shopId,
        platform: "mock",
        platform_live_id: null,
        status: "Active",
        shop_name: shopName,
        started_at: new Date(),
      });
      connInfo.sessionId = session.id;
      console.log(`💾 [${shopName}] Mock session saved: ${session.id}`);
    } catch (e) {
      console.error(`⚠️ [${shopName}] Không thể lưu mock session:`, e.message);
    }

    io.to(`shop_${shopId}`).emit("crawler_status", {
      status: "mock",
      shopName,
    });

    io.to(`shop_${shopId}`).emit("viewer_count", { count: mockViewers });

    console.log(`🎭 [${shopName}] Mock mode started`);
    return { success: true };
  }

  /**
   * Ngắt kết nối 1 shop
   */
  async stopConnection(shopId) {
    const conn = this.connections.get(shopId);
    if (!conn) return;

    // Lưu session vào DB trước khi xóa
    if (conn.sessionId) {
      try {
        await endSession(conn.sessionId, {
          total: conn.stats.total,
          hot: conn.stats.hot,
          warm: conn.stats.warm,
          cold: conn.stats.cold,
          peakViewers: conn.peakViewers || 0,
        });
        console.log(`💾 [${conn.shopName}] Session ended & saved`);
      } catch (e) {
        console.error(`⚠️ [${conn.shopName}] Không thể lưu session:`, e.message);
      }
    }

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
