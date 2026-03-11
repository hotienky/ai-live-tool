import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare displayName: string | null

  @column()
  declare description: string | null

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => {
      if (!value) return []
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare permissions: string[]

  @column()
  declare isSystem: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * All available permissions in the system
   */
  static availablePermissions() {
    return [
      { slug: 'dashboard.view', label: 'Xem Dashboard', group: 'Dashboard' },
      { slug: 'products.manage', label: 'Quản lý Sản phẩm', group: 'Sản phẩm' },
      { slug: 'orders.manage', label: 'Quản lý Đơn hàng', group: 'Đơn hàng' },
      { slug: 'customers.manage', label: 'Quản lý Khách hàng', group: 'Khách hàng' },
      { slug: 'leads.manage', label: 'Quản lý Leads', group: 'CRM' },
      { slug: 'sessions.manage', label: 'Quản lý Live Sessions', group: 'Live' },
      { slug: 'settings.manage', label: 'Cấu hình Shop', group: 'Cài đặt' },
      { slug: 'users.manage', label: 'Quản lý Users', group: 'Hệ thống' },
      { slug: 'roles.manage', label: 'Quản lý Phân quyền', group: 'Hệ thống' },
      { slug: 'analytics.view', label: 'Xem Thống kê', group: 'Báo cáo' },
      { slug: 'cms.manage', label: 'Quản lý CMS', group: 'Nội dung' },
      { slug: 'banners.manage', label: 'Quản lý Banners', group: 'Nội dung' },
      { slug: 'promotions.manage', label: 'Quản lý Khuyến mãi', group: 'Bán hàng' },
      { slug: 'shipping.manage', label: 'Quản lý Vận chuyển', group: 'Vận hành' },
      { slug: 'webhooks.manage', label: 'Quản lý Webhooks', group: 'API' },
      { slug: 'activity_logs.view', label: 'Xem Nhật ký', group: 'Hệ thống' },
    ]
  }
}
