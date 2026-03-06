const { DataTypes } = require("sequelize");
const { sequelize, DB_ENABLED } = require("./connection");

let Shop, LivestreamSession, Customer, ChatLog, Lead, Product, ShopKeyword, AutoReplyTemplate, User;

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
      facebook_page_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      youtube_channel_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      platform: {
        type: DataTypes.STRING,
        defaultValue: "tiktok", // tiktok, shopee, facebook, youtube
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
        type: DataTypes.STRING,
        allowNull: false,
      },
      platform_live_id: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "Active", // Active, Ended
      },
      started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      ended_at: {
        type: DataTypes.DATE,
      },
      // ── Stats ──
      total_comments: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      hot_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      warm_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      cold_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      peak_viewers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      shop_name: {
        type: DataTypes.STRING,
        allowNull: true,
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
        allowNull: true,
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      customer_id: {
        type: DataTypes.UUID,
        references: { model: "customers", key: "id" },
        allowNull: true,
      },
      nickname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unique_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      comment_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ai_label: {
        type: DataTypes.STRING, // HOT, WARM, COLD
        allowNull: true,
      },
      platform: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_link: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      profile_picture_url: {
        type: DataTypes.TEXT,
        allowNull: true,
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
        { fields: ["shop_id"] },
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

  // ──── 6. products ────────────────────────────────────────
  Product = sequelize.define(
    "Product",
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(12, 0),
        defaultValue: 0,
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      keywords: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      is_live: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "products",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Shop.hasMany(Product, { foreignKey: "shop_id" });
  Product.belongsTo(Shop, { foreignKey: "shop_id" });

  // ──── 7. shop_keywords (Custom keyword alerts) ────────
  ShopKeyword = sequelize.define(
    "ShopKeyword",
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
      keyword: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alert_type: {
        type: DataTypes.STRING, // "highlight", "notify", "auto_reply"
        defaultValue: "highlight",
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: "#ff3b5c",
      },
      auto_reply_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "shop_keywords",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Shop.hasMany(ShopKeyword, { foreignKey: "shop_id" });
  ShopKeyword.belongsTo(Shop, { foreignKey: "shop_id" });

  // ──── 8. auto_reply_templates ─────────────────────────
  AutoReplyTemplate = sequelize.define(
    "AutoReplyTemplate",
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
      trigger_label: {
        type: DataTypes.STRING, // "HOT", "WARM", or keyword
        allowNull: false,
      },
      template_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "auto_reply_templates",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Shop.hasMany(AutoReplyTemplate, { foreignKey: "shop_id" });
  AutoReplyTemplate.belongsTo(Shop, { foreignKey: "shop_id" });

  // ──── 9. users (Authentication) ─────────────────────
  User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING, // "admin", "user", "viewer"
        defaultValue: "user",
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
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
    await sequelize.sync({ alter: true });
    console.log("📦 Database: Đã sync tất cả models");
  } catch (error) {
    console.error("❌ Database: Không thể kết nối:", error.message);
    console.log("📦 Tiếp tục chạy in-memory mode...");
  }
}

/**
 * Lưu comment vào database (upsert customer + insert chat_log + insert lead nếu HOT/WARM)
 * @param {object} commentData - { comment, label, nickname, uniqueId, platform, profileLink, profilePictureUrl, shopId }
 * @param {string|null} sessionId - Session ID (nếu có)
 */
async function saveComment(commentData, sessionId = null) {
  if (!DB_ENABLED || !sequelize) return null;

  try {
    const platform = commentData.platform || "tiktok";
    const uniqueId = commentData.uniqueId;
    const label = (commentData.label || "[COLD]").replace(/\[|\]/g, ""); // "[HOT]" -> "HOT"

    // Upsert customer (nếu có uniqueId)
    let customerId = null;
    if (uniqueId) {
      const [customer] = await Customer.findOrCreate({
        where: {
          platform,
          platform_user_id: uniqueId,
        },
        defaults: {
          nickname: commentData.nickname,
          profile_link: commentData.profileLink,
          total_interactions: 1,
        },
      });

      if (!customer.isNewRecord) {
        await customer.increment("total_interactions");
        // Update nickname nếu thay đổi
        if (commentData.nickname && commentData.nickname !== customer.nickname) {
          await customer.update({ nickname: commentData.nickname });
        }
      }
      customerId = customer.id;
    }

    // Insert chat log
    const chatLog = await ChatLog.create({
      session_id: sessionId || null,
      shop_id: commentData.shopId || null,
      customer_id: customerId,
      nickname: commentData.nickname,
      unique_id: uniqueId,
      comment_text: commentData.comment,
      ai_label: label,
      platform,
      profile_link: commentData.profileLink,
      profile_picture_url: commentData.profilePictureUrl,
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
  Product,
  ShopKeyword,
  AutoReplyTemplate,
  User,
  syncDatabase,
  saveComment,
};
