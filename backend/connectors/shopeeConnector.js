const BaseConnector = require("./BaseConnector");

/**
 * ShopeeConnector — Kết nối Shopee Live
 * 
 * Hiện tại Shopee không có public API cho live comments.
 * Connector này sử dụng polling từ Shopee Live web page.
 * Cần cung cấp shopee_live_id hoặc shop_id để theo dõi.
 * 
 * TODO: Tích hợp khi Shopee mở API hoặc dùng web scraping
 */
class ShopeeConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pollInterval = null;
    this.mockViewers = 0;
  }

  get platform() {
    return "shopee";
  }

  async connect() {
    const shopeeId = this.config.shopee_id || this.config.username;
    if (!shopeeId) throw new Error("Cần cấu hình Shopee ID");

    this.status = "connecting";
    console.log(`🛒 [Shopee] Đang kết nối Shopee Live: ${shopeeId}...`);

    // Shopee Live hiện chưa có public API
    // Giả lập kết nối - trong thực tế sẽ dùng web scraping hoặc API
    this.status = "connected";
    this.mockViewers = Math.floor(500 + Math.random() * 2000);

    // Simulate comments polling (mỗi 3-5 giây)
    const { MOCK_COMMENTS, AVATARS } = require("../mock_service");
    let idx = 0;

    this.pollInterval = setInterval(() => {
      const mock = MOCK_COMMENTS[idx % MOCK_COMMENTS.length];
      this._emit("chat", {
        nickname: `shopee_${mock.nickname}`,
        uniqueId: `shopee_${mock.uniqueId}`,
        comment: mock.comment,
        profilePictureUrl: AVATARS[idx % AVATARS.length],
      });

      // Fluctuate viewers
      this.mockViewers += Math.floor(Math.random() * 100 - 40);
      this.mockViewers = Math.max(50, this.mockViewers);
      this._emit("roomUser", { viewerCount: this.mockViewers });

      idx++;
    }, 3000 + Math.random() * 2000);

    return { roomId: `shopee_${shopeeId}`, viewerCount: this.mockViewers };
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    super.disconnect();
    console.log("🛒 [Shopee] Ngắt kết nối");
  }
}

module.exports = ShopeeConnector;
