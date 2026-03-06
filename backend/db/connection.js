const { Sequelize } = require("sequelize");
require("dotenv").config();

const DB_ENABLED = process.env.DB_ENABLED === "true";

let sequelize = null;

if (DB_ENABLED) {
  const dbName = process.env.DB_DATABASE || "ai_live_tool";
  const dbUser = process.env.DB_USER || "postgres";
  const dbPassword = process.env.DB_PASSWORD || "postgres";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || 5432;

  // Hỗ trợ cả DATABASE_URL (production) và biến riêng lẻ (dev)
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    });
  } else {
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: "postgres",
      logging: false,
      pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    });
  }
}

module.exports = { sequelize, DB_ENABLED };
