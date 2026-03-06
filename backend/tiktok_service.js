const { WebcastPushConnection } = require("tiktok-live-connector");
const { analyzeComment } = require("./ai_service");

let tiktokConnection = null;

/**
 * Bắt đầu lắng nghe TikTok Live comments
 * @param {string} username - TikTok username đang live
 * @param {object} io - Socket.io server instance
 * @param {object} stats - Shared stats object
 */
async function startTikTokListener(username, io, stats) {
  console.log(`🎬 Đang kết nối tới TikTok Live: @${username}...`);

  tiktokConnection = new WebcastPushConnection(username);

  try {
    const state = await tiktokConnection.connect();
    console.log(`✅ Đã kết nối TikTok Live!`);
    console.log(`   Room ID: ${state.roomId}`);
    console.log(`   Viewers: ${state.viewerCount}`);

    // Lắng nghe sự kiện chat
    tiktokConnection.on("chat", async (data) => {
      const comment = data.comment;
      const nickname = data.nickname;
      const uniqueId = data.uniqueId;
      const profilePictureUrl = data.profilePictureUrl;

      try {
        // Phân loại bằng AI
        const label = await analyzeComment(comment);
        const profileLink = `https://www.tiktok.com/@${uniqueId}`;

        const commentData = {
          id: `tt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          platform: "tiktok",
          nickname,
          uniqueId,
          comment,
          label,
          profileLink,
          profilePictureUrl,
          timestamp: new Date().toISOString(),
        };

        // Update stats
        if (label === "[HOT]") stats.hot++;
        else if (label === "[WARM]") stats.warm++;
        else stats.cold++;
        stats.total++;

        // Emit tới tất cả clients
        io.emit("new_comment", commentData);

        // Emit stats update
        io.emit("stats_update", { ...stats });

        // Log
        const icon =
          label === "[HOT]" ? "🔥" : label === "[WARM]" ? "🟠" : "⚪";
        console.log(`${icon} ${label} @${uniqueId}: ${comment}`);
      } catch (err) {
        console.error("❌ Error processing comment:", err.message);
      }
    });

    // Sự kiện viewer count
    tiktokConnection.on("roomUser", (data) => {
      io.emit("viewer_count", { count: data.viewerCount });
    });

    // Sự kiện disconnect
    tiktokConnection.on("disconnected", () => {
      console.log("⚠️ TikTok Live đã ngắt kết nối");
      io.emit("crawler_status", { status: "disconnected" });
    });
  } catch (err) {
    console.error(`❌ Không thể kết nối TikTok Live @${username}:`, err.message);
    io.emit("crawler_status", {
      status: "error",
      message: err.message,
    });
  }
}

/**
 * Ngắt kết nối TikTok
 */
function stopTikTokListener() {
  if (tiktokConnection) {
    tiktokConnection.disconnect();
    tiktokConnection = null;
    console.log("🛑 Đã ngắt kết nối TikTok Live");
  }
}

module.exports = { startTikTokListener, stopTikTokListener };
