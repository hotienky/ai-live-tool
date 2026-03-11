import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'pg',

  connections: {
    // Default tenant connection (will be dynamically patched per-request)
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST', 'localhost'),
        port: Number(env.get('DB_PORT', '5432')),
        user: env.get('DB_USER', 'postgres'),
        password: env.get('DB_PASSWORD', 'postgres'),
        database: env.get('DB_DATABASE', 'ai_live_tool'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    // Master DB — tenant registry, master users, plans
    master: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST', 'localhost'),
        port: Number(env.get('DB_PORT', '5432')),
        user: env.get('DB_USER', 'postgres'),
        password: env.get('DB_PASSWORD', 'postgres'),
        database: env.get('MASTER_DB_DATABASE', 'master_db'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations/master'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig

