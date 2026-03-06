const { DataTypes } = require("sequelize");
const { sequelize, DB_ENABLED } = require("./connection");

let Shop, LivestreamSession, Customer, ChatLog, Lead;

if (DB_ENABLED && sequelize) {
  // ──── 1. shops ─────────────────────────────────────────
  Shop = sequelize.define(
    "Shop",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shop_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tiktok_username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shopee_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      owner_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      subscription_plan: {
        type: DataTypes.STRING,
        defaultValue: "Free", // Free, Pro, Enterprise
      },
    },
    {
      tableName: "shops",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // ──── 2. livestream_sessions ──────────────────────────
  LivestreamSession = sequelize.define(
    "LivestreamSession",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      shop_id: {
        type: DataTypes.UUID,
        references: { model: "shops", key: "id" },
      },
      platform: {
        type: DataTypes.STRING, // "Tiktok" | "Shopee"
        allowNull: false,
      },
      platform_live_id: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.ENUM("Active", "Ended"),
        defaultValue: "Active",
      },
      started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      ended_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "livestream_sessions",
      timestamps: false,
    }
  );

  // ──── 3. customers (CRM) ─────────────────────────────
  Customer = sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      platform: {
        type: DataTypes.STRING, // "Tiktok" | "Shopee"
        allowNull: false,
      },
      platform_user_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nickname: {
        type: DataTypes.STRING,
      },
      profile_link: {
        type: DataTypes.TEXT,
      },
      total_interactions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "customers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["platform", "platform_user_id"],
        },
      ],
    }
  );

  // ──── 4. chat_logs (High-write volume) ─────────────────
  ChatLog = sequelize.define(
    "ChatLog",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      session_id: {
        type: DataTypes.UUID,
        references: { model: "livestream_sessions", key: "id" },
      },
      customer_id: {
        type: DataTypes.UUID,
        references: { model: "customers", key: "id" },
      },
      comment_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ai_label: {
        type: DataTypes.ENUM("HOT", "WARM", "COLD"),
        allowNull: false,
      },
    },
    {
      tableName: "chat_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { fields: ["ai_label"] },
        { fields: ["session_id"] },
        { fields: ["created_at"] },
      ],
    }
  );

  // ──── 5. leads (HOT/WARM only) ─────────────────────────
  Lead = sequelize.define(
    "Lead",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      chat_log_id: {
        type: DataTypes.BIGINT,
        references: { model: "chat_logs", key: "id" },
      },
      status: {
        type: DataTypes.ENUM("New", "Contacting", "Closed", "Ignored"),
        defaultValue: "New",
      },
      product_intent: {
        type: DataTypes.STRING,
      },
      staff_notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "leads",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["status"] }],
    }
  );

  // ──── Relations ─────────────────────────────────────────
  Shop.hasMany(LivestreamSession, { foreignKey: "shop_id" });
  LivestreamSession.belongsTo(Shop, { foreignKey: "shop_id" });

  LivestreamSession.hasMany(ChatLog, { foreignKey: "session_id" });
  ChatLog.belongsTo(LivestreamSession, { foreignKey: "session_id" });

  Customer.hasMany(ChatLog, { foreignKey: "customer_id" });
  ChatLog.belongsTo(Customer, { foreignKey: "customer_id" });

  ChatLog.hasOne(Lead, { foreignKey: "chat_log_id" });
  Lead.belongsTo(ChatLog, { foreignKey: "chat_log_id" });
}

/**
 * Sync database tables (create if not exist)
 */
async function syncDatabase() {
  if (!DB_ENABLED || !sequelize) {
    console.log("📦 Database: DISABLED (chạy in-memory mode)");
    return;
  }

  try {
    await sequelize.authenticate();
    console.log("📦 Database: Kết nối PostgreSQL thành công!");
    await sequelize.sync({ alter: false });
    console.log("📦 Database: Đã sync tất cả models");
  } catch (error) {
    console.error("❌ Database: Không thể kết nối:", error.message);
    console.log("📦 Tiếp tục chạy in-memory mode...");
  }
}

/**
 * Lưu comment vào database (upsert customer + insert chat_log + insert lead nếu HOT/WARM)
 */
async function saveComment(commentData, sessionId = null) {
  if (!DB_ENABLED || !sequelize) return null;

  try {
    // Upsert customer
    const [customer] = await Customer.findOrCreate({
      where: {
        platform: commentData.platform || "tiktok",
        platform_user_id: commentData.uniqueId,
      },
      defaults: {
        nickname: commentData.nickname,
        profile_link: commentData.profileLink,
        total_interactions: 1,
      },
    });

    // Increment interaction count if existing
    if (!customer.isNewRecord) {
      await customer.increment("total_interactions");
    }

    // Insert chat log
    const label = commentData.label.replace(/\[|\]/g, ""); // "[HOT]" -> "HOT"
    const chatLog = await ChatLog.create({
      session_id: sessionId,
      customer_id: customer.id,
      comment_text: commentData.comment,
      ai_label: label,
    });

    // Create lead if HOT or WARM
    if (label === "HOT" || label === "WARM") {
      await Lead.create({
        chat_log_id: chatLog.id,
        status: "New",
      });
    }

    return chatLog;
  } catch (error) {
    console.error("❌ DB saveComment error:", error.message);
    return null;
  }
}

module.exports = {
  Shop,
  LivestreamSession,
  Customer,
  ChatLog,
  Lead,
  syncDatabase,
  saveComment,
};
