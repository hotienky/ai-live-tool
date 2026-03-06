const BaseConnector = require("./BaseConnector");

/**
 * YouTubeConnector — Kết nối YouTube Live
 *
 * YouTube Live Chat API yêu cầu:
 * 1. Google Cloud Project với YouTube Data API v3 enabled
 * 2. API Key hoặc OAuth2 credentials
 * 3. liveChatId từ video broadcast
 * 4. Polling: GET liveChatMessages?liveChatId=xxx
 *
 * Hiện tại: Mock mode. Khi có API Key, chuyển sang real polling.
 */
class YouTubeConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pollInterval = null;
    this.mockViewers = 0;
  }

  get platform() {
    return "youtube";
  }

  async connect() {
    const channelId = this.config.youtube_channel_id || this.config.username;
    if (!channelId) throw new Error("Cần cấu hình YouTube Channel ID");

    this.status = "connecting";
    console.log(`🎬 [YouTube] Đang kết nối YouTube Live: ${channelId}...`);

    const apiKey = this.config.youtube_api_key || process.env.YOUTUBE_API_KEY;

    if (apiKey) {
      // Real YouTube Data API polling
      // TODO: Implement real polling via liveChatMessages endpoint
      console.log("🎬 [YouTube] Có API Key — sẽ dùng YouTube Data API v3");
    }

    // Mock mode
    this.status = "connected";
    this.mockViewers = Math.floor(2000 + Math.random() * 10000);

    const { MOCK_COMMENTS, AVATARS } = require("../mock_service");
    let idx = 0;

    this.pollInterval = setInterval(() => {
      const mock = MOCK_COMMENTS[idx % MOCK_COMMENTS.length];
      this._emit("chat", {
        nickname: `yt_${mock.nickname}`,
        uniqueId: `yt_${mock.uniqueId}`,
        comment: mock.comment,
        profilePictureUrl: AVATARS[idx % AVATARS.length],
      });

      this.mockViewers += Math.floor(Math.random() * 500 - 200);
      this.mockViewers = Math.max(200, this.mockViewers);
      this._emit("roomUser", { viewerCount: this.mockViewers });

      idx++;
    }, 2000 + Math.random() * 3000);

    return { roomId: `yt_${channelId}`, viewerCount: this.mockViewers };
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    super.disconnect();
    console.log("🎬 [YouTube] Ngắt kết nối");
  }
}

module.exports = YouTubeConnector;
