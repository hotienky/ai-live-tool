const BaseConnector = require("./BaseConnector");
const { WebcastPushConnection } = require("tiktok-live-connector");

/**
 * TikTokConnector — Kết nối TikTok Live via tiktok-live-connector
 */
class TikTokConnector extends BaseConnector {
  constructor(username) {
    super({ username });
    this.connection = null;
  }

  get platform() {
    return "tiktok";
  }

  async connect() {
    this.status = "connecting";
    this.connection = new WebcastPushConnection(this.config.username);

    const state = await this.connection.connect();
    this.status = "connected";

    // Proxy events
    this.connection.on("chat", (data) => {
      this._emit("chat", {
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        comment: data.comment,
        profilePictureUrl: data.profilePictureUrl,
      });
    });

    this.connection.on("roomUser", (data) => {
      this._emit("roomUser", { viewerCount: data.viewerCount });
    });

    this.connection.on("disconnected", () => {
      this.status = "disconnected";
      this._emit("disconnected");
    });

    return { roomId: state.roomId, viewerCount: state.viewerCount };
  }

  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
    }
    super.disconnect();
  }
}

module.exports = TikTokConnector;
