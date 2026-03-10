import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * CmsPage — S-Cart: FrontPage
 * CMS content pages with HTML content and URL alias
 */
export default class CmsPage extends BaseModel {
  static table = 'cms_pages'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare alias: string

  @column()
  declare content: string | null

  @column()
  declare image: string | null

  @column()
  declare status: number

  @column()
  declare sort: number

  @column()
  declare storeId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
