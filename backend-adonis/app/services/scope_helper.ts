/**
 * Helper to get shop IDs owned by the authenticated user.
 * Used by all controllers to scope queries to user's data.
 *
 * Returns null for tenant DBs (no shops table) — controllers should
 * skip shop_id scoping when null (entire DB is already tenant-scoped).
 */
import Shop from '#models/shop'

export async function getUserShopIds(userId: number): Promise<string[] | null> {
  try {
    const shops = await Shop.query().where('userId', userId).select('id')
    return shops.map((s) => String(s.id))
  } catch {
    // shops table doesn't exist in tenant DB — return null to skip scoping
    return null
  }
}
