/**
 * BaseConnector — Interface chung cho tất cả platform connectors
 * Mỗi platform (TikTok, Shopee, Facebook, YouTube) implement class này
 */
class BaseConnector {
  constructor(config = {}) {
    this.config = config;
    this.status = "idle"; // idle, connecting, connected, disconnected, error
    this.listeners = { chat: [], roomUser: [], disconnected: [] };
  }

  /**
   * Kết nối tới livestream
   * @returns {Promise<{roomId: string, viewerCount: number}>}
   */
  async connect() {
    throw new Error("connect() must be implemented by subclass");
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    this.status = "disconnected";
    this._emit("disconnected");
  }

  /**
   * Đăng ký event listener
   * @param {string} event - "chat" | "roomUser" | "disconnected"
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  /**
   * Emit event tới listeners
   */
  _emit(event, data) {
    const handlers = this.listeners[event] || [];
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(`❌ Connector event error [${event}]:`, err.message);
      }
    }
  }

  /**
   * Platform name
   */
  get platform() {
    return "unknown";
  }
}

module.exports = BaseConnector;
