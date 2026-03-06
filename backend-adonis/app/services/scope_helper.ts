/**
 * Helper to get shop IDs owned by the authenticated user.
 * Used by all controllers to scope queries to user's data.
 */
import Shop from '#models/shop'

export async function getUserShopIds(userId: number): Promise<string[]> {
  const shops = await Shop.query().where('userId', userId).select('id')
  return shops.map((s) => String(s.id))
}
