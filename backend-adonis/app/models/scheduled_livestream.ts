import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Shop from '#models/shop'

export default class ScheduledLivestream extends BaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare shopId: string
  @column() declare title: string
  @column() declare description: string | null
  @column() declare platform: string
  @column() declare productIds: any
  @column() declare script: string | null
  @column() declare status: string
  @column.dateTime() declare scheduledAt: DateTime
  @column() declare durationMinutes: number
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @belongsTo(() => Shop) declare shop: BelongsTo<typeof Shop>
}
