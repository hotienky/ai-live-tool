const BaseConnector = require("./BaseConnector");

/**
 * FacebookConnector — Kết nối Facebook Live
 *
 * Facebook Live API yêu cầu:
 * 1. Facebook App với Page Access Token
 * 2. Permission: pages_read_engagement, pages_manage_metadata
 * 3. API endpoint: GET /{live-video-id}/comments
 *
 * Hiện tại: Mock mode. Khi có Facebook App token, 
 * chuyển sang Graph API polling.
 */
class FacebookConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pollInterval = null;
    this.mockViewers = 0;
  }

  get platform() {
    return "facebook";
  }

  async connect() {
    const fbPageId = this.config.facebook_page_id || this.config.username;
    if (!fbPageId) throw new Error("Cần cấu hình Facebook Page ID");

    this.status = "connecting";
    console.log(`📘 [Facebook] Đang kết nối Facebook Live: ${fbPageId}...`);

    // Check for access token
    const accessToken = this.config.facebook_access_token || process.env.FACEBOOK_ACCESS_TOKEN;

    if (accessToken) {
      // Real Facebook Graph API polling
      // TODO: Implement real polling
      console.log("📘 [Facebook] Có access token — sẽ dùng Graph API");
    }

    // Mock mode
    this.status = "connected";
    this.mockViewers = Math.floor(1000 + Math.random() * 5000);

    const { MOCK_COMMENTS, AVATARS } = require("../mock_service");
    let idx = 0;

    this.pollInterval = setInterval(() => {
      const mock = MOCK_COMMENTS[idx % MOCK_COMMENTS.length];
      this._emit("chat", {
        nickname: `fb_${mock.nickname}`,
        uniqueId: `fb_${mock.uniqueId}`,
        comment: mock.comment,
        profilePictureUrl: AVATARS[idx % AVATARS.length],
      });

      this.mockViewers += Math.floor(Math.random() * 200 - 80);
      this.mockViewers = Math.max(100, this.mockViewers);
      this._emit("roomUser", { viewerCount: this.mockViewers });

      idx++;
    }, 2500 + Math.random() * 2000);

    return { roomId: `fb_${fbPageId}`, viewerCount: this.mockViewers };
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    super.disconnect();
    console.log("📘 [Facebook] Ngắt kết nối");
  }
}

module.exports = FacebookConnector;
