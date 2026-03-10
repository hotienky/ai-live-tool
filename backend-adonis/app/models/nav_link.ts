import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

/**
 * NavLink — S-Cart: FrontLink
 * Navigation links with group (menu/footer) and hierarchy
 */
export default class NavLink extends BaseModel {
  static table = 'nav_links'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare url: string | null

  @column()
  declare group: string

  @column()
  declare type: string

  @column()
  declare collectionId: string | null

  @column()
  declare target: string

  @column()
  declare icon: string | null

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

  @hasMany(() => NavLink, { foreignKey: 'collectionId' })
  declare children: HasMany<typeof NavLink>
}
