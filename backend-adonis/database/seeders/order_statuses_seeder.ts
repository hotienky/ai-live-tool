import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    // S-Cart default order statuses
    const existing = await db.from('order_statuses').select('id').first()
    if (existing) return // Already seeded

    await db.table('order_statuses').multiInsert([
      { id: 1, name: 'Đơn mới' },
      { id: 2, name: 'Đang xử lý' },
      { id: 3, name: 'Tạm giữ' },
      { id: 4, name: 'Đã hủy' },
      { id: 5, name: 'Hoàn thành' },
      { id: 6, name: 'Thất bại' },
    ])

    // S-Cart default payment statuses
    await db.table('payment_statuses').multiInsert([
      { id: 1, name: 'Chưa thanh toán' },
      { id: 2, name: 'Thanh toán 1 phần' },
      { id: 3, name: 'Đã thanh toán' },
      { id: 4, name: 'Hoàn tiền' },
    ])
  }
}
