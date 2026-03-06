/**
 * JWT Auth Middleware
 * Verify token from Authorization header or cookie
 */
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "ai-live-tool-secret-key-change-in-production";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

/**
 * Middleware xác thực JWT
 * Skip cho: /api/auth/*, /api/health, static files
 */
function authMiddleware(req, res, next) {
  // Skip auth routes
  const publicPaths = ["/api/auth/login", "/api/auth/register", "/api/health"];
  if (publicPaths.some((p) => req.path.startsWith(p))) {
    return next();
  }

  // Get token from header or cookie
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.query?.token) {
    token = req.query.token; // For Socket.IO handshake
  }

  if (!token) {
    return res.status(401).json({ error: "Chưa đăng nhập" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token không hợp lệ hoặc hết hạn" });
  }
}

/**
 * Tạo JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * Socket.IO auth middleware
 */
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
}

module.exports = { authMiddleware, generateToken, socketAuthMiddleware, JWT_SECRET };
