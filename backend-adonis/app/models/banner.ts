import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Banner — S-Cart: FrontBanner
 * Image banners with type (banner/background/breadcrumb)
 */
export default class Banner extends BaseModel {
  static table = 'banners'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare image: string

  @column()
  declare url: string | null

  @column()
  declare type: string

  @column()
  declare sort: number

  @column()
  declare status: number

  @column()
  declare storeId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
