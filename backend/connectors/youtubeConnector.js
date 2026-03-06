const BaseConnector = require("./BaseConnector");

/**
 * YouTubeConnector — Kết nối YouTube Live
 *
 * Hỗ trợ nhập:
 * - Video URL: https://www.youtube.com/watch?v=W8I-xc7irIg
 * - Video ID: W8I-xc7irIg
 * - Channel ID: UCxxxxxx
 *
 * Hiện tại: Mock mode (cần YouTube Data API v3 key để lấy liveChatId).
 * Khi có API Key, sẽ polling liveChatMessages endpoint.
 */
class YouTubeConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.pollInterval = null;
    this.mockViewers = 0;
    this.videoId = this._extractVideoId(
      config.youtube_channel_id || config.username || ""
    );
  }

  get platform() {
    return "youtube";
  }

  /**
   * Trích xuất Video ID từ URL hoặc ID trực tiếp
   */
  _extractVideoId(input) {
    if (!input) return null;
    // Full URL: https://www.youtube.com/watch?v=W8I-xc7irIg
    const urlMatch = input.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/
    );
    if (urlMatch) return urlMatch[1];
    // Already a video/channel ID
    return input.trim();
  }

  async connect() {
    if (!this.videoId) throw new Error("Cần cấu hình YouTube Video URL hoặc ID");

    this.status = "connecting";
    console.log(
      `🎬 [YouTube] Đang kết nối YouTube Live: ${this.videoId}...`
    );

    const apiKey =
      this.config.youtube_api_key || process.env.YOUTUBE_API_KEY;

    if (apiKey) {
      // TODO: Real YouTube Data API v3 polling
      // 1. GET https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id={videoId}&key={apiKey}
      // 2. Lấy liveChatId từ response
      // 3. Poll GET https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId={id}&key={apiKey}
      console.log("🎬 [YouTube] Có API Key — sẽ dùng YouTube Data API v3");
    }

    // Mock mode — giả lập comments
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

    return {
      roomId: `yt_${this.videoId}`,
      viewerCount: this.mockViewers,
    };
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
