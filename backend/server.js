require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { startMockComments, stopMockComments } = require("./mock_service");
const { syncDatabase } = require("./db/models");
const connectionManager = require("./connectionManager");
const shopRoutes = require("./routes/shopRoutes");
const exportRoutes = require("./routes/exportRoutes");
const replyRoutes = require("./routes/replyRoutes");
const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const { isConfigured: isTelegramConfigured } = require("./telegramService");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const MOCK_MODE = process.env.MOCK_MODE === "true";

// ──── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ──── Socket.io ──────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
});

// Lưu io vào app để routes có thể dùng
app.set("io", io);

// ──── Socket.io Events (Multi-tenant) ───────────────────────
io.on("connection", (socket) => {
  console.log(`✅ Client kết nối: ${socket.id}`);

  // Client join shop room
  socket.on("join_shop", (data) => {
    const { shopId } = data;
    // Rời tất cả room cũ (trừ room mặc định)
    for (const room of socket.rooms) {
      if (room !== socket.id && room.startsWith("shop_")) {
        socket.leave(room);
      }
    }
    socket.join(`shop_${shopId}`);
    console.log(`📌 Client ${socket.id} joined room: shop_${shopId}`);

    // Gửi stats hiện tại cho shop
    const stats = connectionManager.getStats(shopId);
    socket.emit("stats_update", stats);

    // Gửi connection status
    const status = connectionManager.isConnected(shopId);
    socket.emit("crawler_status", {
      status: status || "waiting",
    });
  });

  // Client yêu cầu chạy mock cho shop
  socket.on("start_mock", (data) => {
    const { shopId, shopName } = data || {};
    if (shopId) {
      connectionManager.startMockConnection(
        { id: shopId, shop_name: shopName || "Mock Shop" },
        io
      );
    } else {
      // Legacy: chạy mock broadcast (cho trường hợp chưa chọn shop)
      startMockComments(io, { hot: 0, warm: 0, cold: 0, total: 0 });
    }
  });

  // Reset stats cho shop
  socket.on("reset_stats", (data) => {
    const { shopId } = data || {};
    if (shopId) {
      // Reset trong connectionManager nếu có
      const conn = connectionManager.connections.get(shopId);
      if (conn) {
        conn.stats.hot = 0;
        conn.stats.warm = 0;
        conn.stats.cold = 0;
        conn.stats.total = 0;
        conn.stats.startTime = new Date().toISOString();
        io.to(`shop_${shopId}`).emit("stats_update", { ...conn.stats });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client ngắt kết nối: ${socket.id}`);
  });
});

// ──── REST API Routes ──────────────────────────────────────
app.use("/api/shops", shopRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/reply", replyRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mode: MOCK_MODE ? "mock" : "live",
    uptime: process.uptime(),
    activeConnections: connectionManager.connections.size,
    telegram: isTelegramConfigured(),
  });
});

// Supported platforms
const { SUPPORTED_PLATFORMS } = require("./connectors");
app.get("/api/platforms", (req, res) => {
  res.json(SUPPORTED_PLATFORMS);
});

// ──── Start Server ──────────────────────────────────────────
async function startServer() {
  await syncDatabase();

  server.listen(PORT, () => {
    console.log("");
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║   🚀 AI Live-Commerce Server (Multi-Tenant)     ║");
    console.log(`║   📡 Port: ${PORT}                                 ║`);
    console.log(`║   🎭 Mode: ${MOCK_MODE ? "MOCK (Giả lập)" : "LIVE (Production)"}          ║`);
    console.log("╚══════════════════════════════════════════════════╝");
    console.log("");
    console.log("📋 API Endpoints:");
    console.log("   GET    /api/shops              - Danh sách shops");
    console.log("   POST   /api/shops              - Tạo shop mới");
    console.log("   PUT    /api/shops/:id           - Cập nhật shop");
    console.log("   DELETE /api/shops/:id           - Xóa shop");
    console.log("   POST   /api/shops/:id/connect   - Kết nối TikTok");
    console.log("   POST   /api/shops/:id/disconnect- Ngắt kết nối");
    console.log("   GET    /api/shops/:id/stats     - Stats theo shop");
    console.log("");
  });
}

startServer();

// ──── Graceful Shutdown ─────────────────────────────────────
process.on("SIGINT", () => {
  console.log("\n🛑 Đang tắt server...");
  connectionManager.stopAll();
  stopMockComments();
  server.close(() => {
    console.log("👋 Server đã tắt");
    process.exit(0);
  });
});
