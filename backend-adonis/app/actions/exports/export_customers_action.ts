import Customer from '#models/customer'

interface Params {
  userShopIds: string[]
  shopId?: string
}

export default class ExportCustomersAction {
  static async handle({ userShopIds, shopId }: Params) {
    const query = Customer.query()
      .whereIn('shop_id', userShopIds)
      .orderBy('updated_at', 'desc')
    if (shopId) query.where('shopId', shopId as string)
    const customers = await query

    const headers = ['id', 'uniqueId', 'nickname', 'totalComments', 'hotCount', 'lastLabel', 'platform', 'createdAt']
    let csv = headers.join(',') + '\n'
    for (const c of customers) {
      const s = c.serialize()
      csv += headers.map((h) => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(',') + '\n'
    }

    return { customers, csv }
  }
}
