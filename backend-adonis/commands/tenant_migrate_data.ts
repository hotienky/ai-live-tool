import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import TenantService from '#services/tenant_service'

/**
 * tenant:migrate-data — Migrate existing data from source DB to tenant database(s).
 *
 * Usage:
 *   node ace tenant:migrate-data <slug>              # Migrate data for a specific tenant
 *   node ace tenant:migrate-data <slug> --source=ai_live_tool  # Specify source DB name
 *   node ace tenant:migrate-data --all               # Migrate all active tenants
 *   node ace tenant:migrate-data <slug> --dry-run     # Preview only, no writes
 */
export default class TenantMigrateData extends BaseCommand {
  static commandName = 'tenant:migrate-data'
  static description = 'Migrate existing data from source database to tenant database(s)'
  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Tenant slug', required: false })
  declare slug: string

  @flags.string({ description: 'Source database name', alias: 's' })
  declare source: string

  @flags.boolean({ description: 'Migrate all active tenants', default: false })
  declare all: boolean

  @flags.boolean({ description: 'Dry run (preview only)', default: false })
  declare dryRun: boolean

  // Tables to migrate (order matters for foreign key dependencies)
  private readonly TABLES = [
    'users',
    'product_categories',
    'product_brands',
    'products',
    'product_variants',
    'customers',
    'livestream_sessions',
    'chat_logs',
    'leads',
    'orders',
    'banners',
    'cms_pages',
    'shop_keywords',
    'auto_reply_templates',
    'notifications',
    'stock_history',
    'activity_logs',
    'system_configs',
  ]

  async run() {
    const sourceDb = this.source || process.env.DB_DATABASE || 'ai_live_tool'

    if (this.all) {
      const result = await db.connection('master').from('tenants').where('status', 'active')
      if (result.length === 0) {
        this.logger.warning('No active tenants found')
        return
      }
      for (const tenant of result) {
        await this.migrateOneTenant(tenant, sourceDb)
      }
    } else if (this.slug) {
      const tenant = await db.connection('master').from('tenants').where('slug', this.slug).first()
      if (!tenant) {
        this.logger.error(`Tenant "${this.slug}" not found in master registry`)
        return
      }
      await this.migrateOneTenant(tenant, sourceDb)
    } else {
      this.logger.error('Specify a tenant slug or use --all')
      return
    }
  }

  private async migrateOneTenant(tenant: any, sourceDb: string) {
    this.logger.info(`\n${'═'.repeat(60)}`)
    this.logger.info(`Migrating data: ${sourceDb} → ${tenant.db_name} (${tenant.slug})`)
    this.logger.info(`${'═'.repeat(60)}`)

    // Guard: source and target must be different databases
    if (sourceDb === tenant.db_name) {
      this.logger.error(`⚠ Source and target are the SAME database (${sourceDb}). Skipping.`)
      this.logger.info('  → Use --source=<other_db> to specify a different source database.')
      return
    }

    // 1. Ensure tenant schema exists
    if (!this.dryRun) {
      try {
        await TenantService.migrateTenant(tenant.slug, tenant.db_name)
        this.logger.success('✓ Tenant schema verified/created')
      } catch (err: any) {
        this.logger.warning(`Schema check: ${err.message}`)
      }
    }

    // 2. Connect to source DB
    const srcConnName = `src_${Date.now()}`
    db.manager.patch(srcConnName, {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: sourceDb,
      },
    })

    // 3. Connect to target tenant DB
    const tgtConnName = `tgt_${Date.now()}`
    db.manager.patch(tgtConnName, {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: tenant.db_name,
      },
    })

    const srcConn = db.connection(srcConnName)
    const tgtConn = db.connection(tgtConnName)

    let totalMigrated = 0

    try {
      for (const table of this.TABLES) {
        const count = await this.migrateTable(srcConn, tgtConn, table)
        totalMigrated += count
      }

      this.logger.info(`\n${'─'.repeat(40)}`)
      if (this.dryRun) {
        this.logger.info(`🔍 DRY RUN: Would migrate ${totalMigrated} total rows`)
      } else {
        this.logger.success(`✅ Migrated ${totalMigrated} total rows to ${tenant.db_name}`)
      }
    } catch (err: any) {
      this.logger.error(`Migration failed: ${err.message}`)
    } finally {
      await db.manager.close(srcConnName)
      await db.manager.close(tgtConnName)
    }
  }

  /**
   * Get column names for a table in the target DB
   */
  private async getTargetColumns(
    tgtConn: ReturnType<typeof db.connection>,
    table: string
  ): Promise<string[]> {
    const result = await tgtConn.rawQuery(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
      ORDER BY ordinal_position
    `)
    return result.rows.map((r: any) => r.column_name)
  }

  /**
   * Get JSONB/JSON column names for proper serialization
   */
  private async getJsonColumns(
    conn: ReturnType<typeof db.connection>,
    table: string
  ): Promise<string[]> {
    const result = await conn.rawQuery(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
        AND data_type IN ('json', 'jsonb')
    `)
    return result.rows.map((r: any) => r.column_name)
  }

  private async migrateTable(
    srcConn: ReturnType<typeof db.connection>,
    tgtConn: ReturnType<typeof db.connection>,
    table: string
  ): Promise<number> {
    try {
      // Check if table exists in source
      const tableExists = await srcConn.rawQuery(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = '${table}'
        )
      `)
      if (!tableExists.rows[0]?.exists) {
        this.logger.warning(`  ⊘ ${table}: not found in source DB (skipped)`)
        return 0
      }

      // Read all rows from source
      const rows = await srcConn.from(table).select('*')

      if (rows.length === 0) {
        this.logger.info(`  ○ ${table}: 0 rows (empty)`)
        return 0
      }

      // Get target table columns to filter out extra source columns
      const targetCols = await this.getTargetColumns(tgtConn, table)
      if (targetCols.length === 0) {
        this.logger.warning(`  ⊘ ${table}: not found in target DB (skipped)`)
        return 0
      }

      // Get JSON columns in target for proper serialization
      const jsonCols = await this.getJsonColumns(tgtConn, table)
      const targetColSet = new Set(targetCols)
      // Always exclude shop_id (tenant-scoped now)
      targetColSet.delete('shop_id')

      if (this.dryRun) {
        this.logger.info(`  ● ${table}: ${rows.length} rows (would migrate, ${targetCols.length} columns)`)
        return rows.length
      }

      // Clean rows: keep only columns that exist in target + serialize JSON
      const cleanedRows = rows.map((row: any) => {
        const cleaned: any = {}
        for (const col of targetColSet) {
          if (col in row) {
            let val = row[col]
            // Serialize JS objects to JSON strings for json/jsonb columns
            if (jsonCols.includes(col) && val !== null && typeof val === 'object') {
              val = JSON.stringify(val)
            }
            cleaned[col] = val
          }
        }
        return cleaned
      })

      // Batch insert (chunks of 50 to stay well under param limits)
      const CHUNK_SIZE = 50
      let inserted = 0

      for (let i = 0; i < cleanedRows.length; i += CHUNK_SIZE) {
        const chunk = cleanedRows.slice(i, i + CHUNK_SIZE)
        try {
          await tgtConn.table(table).multiInsert(chunk)
          inserted += chunk.length
        } catch (err: any) {
          // Handle duplicate key / unique constraint — retry individually
          if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint') || err.message?.includes('already exists')) {
            for (const row of chunk) {
              try {
                await tgtConn.table(table).insert(row)
                inserted++
              } catch {
                // Skip duplicates silently
              }
            }
          } else {
            this.logger.error(`  ✗ ${table}: ${err.message}`)
            return inserted
          }
        }
      }

      // Reset sequence to max ID
      try {
        await tgtConn.rawQuery(`
          SELECT setval(pg_get_serial_sequence('${table}', 'id'),
                        COALESCE((SELECT MAX(id) FROM ${table}), 1))
        `)
      } catch {
        // Table might not have serial ID
      }

      this.logger.success(`  ✓ ${table}: ${inserted}/${rows.length} rows migrated`)
      return inserted
    } catch (err: any) {
      this.logger.error(`  ✗ ${table}: ${err.message}`)
      return 0
    }
  }
}
