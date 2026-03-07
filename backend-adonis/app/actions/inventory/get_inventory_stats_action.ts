import type { HttpContext } from '@adonisjs/core/http'
import { getInventoryStats } from '#services/inventory_service'
import { getUserShopIds } from '#services/scope_helper'

export default async function getInventoryStatsAction({ auth, request, response }: HttpContext) {
  const userShopIds = await getUserShopIds(auth.user!.id)
  const { shopId } = request.qs()
  const targetShopId = Number(shopId) || userShopIds[0]
  if (!userShopIds.includes(targetShopId)) {
    return response.forbidden({ error: 'Access denied' })
  }
  const stats = await getInventoryStats(targetShopId)
  return response.json(stats)
}
