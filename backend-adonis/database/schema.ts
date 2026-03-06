import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import SnakeCaseSerializer from '../app/strategies/snake_case_serializer.js'

BaseModel.namingStrategy = new SnakeCaseSerializer()

// ──── 1. User ──────────────────────────────────────────
export class UserSchema extends BaseModel {
  static table = 'users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

// ──── 2. Shop ──────────────────────────────────────────
export class ShopSchema extends BaseModel {
  static table = 'shops'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shopName: string

  @column()
  declare userId: number

  @column()
  declare platform: string

  @column()
  declare tiktokUsername: string | null

  @column()
  declare shopeeShopId: string | null

  @column()
  declare facebookPageId: string | null

  @column()
  declare youtubeChannel: string | null

  @column()
  declare isActive: boolean

  @column()
  declare autoReplyEnabled: boolean

  @column()
  declare facebookAccessToken: string | null

  @column()
  declare youtubeApiKey: string | null

  @column()
  declare shopeePartnerId: string | null

  @column()
  declare shopeePartnerKey: string | null

  @column()
  declare shopeeShopIdApi: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => LivestreamSessionSchema, { foreignKey: 'shopId' })
  declare sessions: HasMany<typeof LivestreamSessionSchema>

  @hasMany(() => ProductSchema, { foreignKey: 'shopId' })
  declare products: HasMany<typeof ProductSchema>

  @hasMany(() => ShopKeywordSchema, { foreignKey: 'shopId' })
  declare keywords: HasMany<typeof ShopKeywordSchema>

  @hasMany(() => AutoReplyTemplateSchema, { foreignKey: 'shopId' })
  declare templates: HasMany<typeof AutoReplyTemplateSchema>
}

// ──── 3. LivestreamSession ─────────────────────────────
export class LivestreamSessionSchema extends BaseModel {
  static table = 'livestream_sessions'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shopId: number

  @column()
  declare platform: string

  @column()
  declare roomId: string | null

  @column()
  declare title: string | null

  @column()
  declare status: string

  @column()
  declare viewerCount: number

  @column()
  declare commentCount: number

  @column()
  declare hotLeadCount: number

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare endedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => ShopSchema, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof ShopSchema>

  @hasMany(() => ChatLogSchema, { foreignKey: 'sessionId' })
  declare chatLogs: HasMany<typeof ChatLogSchema>
}

// ──── 4. Customer ──────────────────────────────────────
export class CustomerSchema extends BaseModel {
  static table = 'customers'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uniqueId: string

  @column()
  declare nickname: string

  @column()
  declare profilePictureUrl: string | null

  @column()
  declare profileLink: string | null

  @column()
  declare platform: string | null

  @column()
  declare totalComments: number

  @column()
  declare hotCount: number

  @column()
  declare lastLabel: string | null

  @column()
  declare shopId: number | null

  @column({ prepare: (v: any) => typeof v === 'string' ? v : JSON.stringify(v), consume: (v: any) => typeof v === 'string' ? JSON.parse(v) : v })
  declare tags: any

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => ChatLogSchema, { foreignKey: 'customerId' })
  declare chatLogs: HasMany<typeof ChatLogSchema>
}

// ──── 5. ChatLog ───────────────────────────────────────
export class ChatLogSchema extends BaseModel {
  static table = 'chat_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shopId: number | null

  @column()
  declare sessionId: number | null

  @column()
  declare customerId: number | null

  @column()
  declare uniqueId: string

  @column()
  declare nickname: string

  @column()
  declare commentText: string

  @column()
  declare aiLabel: string | null

  @column()
  declare aiSummary: string | null

  @column()
  declare productIntent: string | null

  @column()
  declare platform: string | null

  @column()
  declare profileLink: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => CustomerSchema, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof CustomerSchema>

  @belongsTo(() => LivestreamSessionSchema, { foreignKey: 'sessionId' })
  declare session: BelongsTo<typeof LivestreamSessionSchema>
}

// ──── 6. Lead ──────────────────────────────────────────
export class LeadSchema extends BaseModel {
  static table = 'leads'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare chatLogId: number | null

  @column()
  declare customerId: number | null

  @column()
  declare uniqueId: string

  @column()
  declare nickname: string

  @column()
  declare comment: string

  @column()
  declare label: string

  @column()
  declare status: string

  @column()
  declare notes: string | null

  @column()
  declare productIntent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ChatLogSchema, { foreignKey: 'chatLogId' })
  declare chatLog: BelongsTo<typeof ChatLogSchema>

  @belongsTo(() => CustomerSchema, { foreignKey: 'customerId' })
  declare leadCustomer: BelongsTo<typeof CustomerSchema>
}

// ──── 7. Product ───────────────────────────────────────
export class ProductSchema extends BaseModel {
  static table = 'products'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shopId: number

  @column()
  declare name: string

  @column()
  declare price: number | null

  @column()
  declare keywords: string | null

  @column()
  declare description: string | null

  @column()
  declare imageUrl: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ShopSchema, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof ShopSchema>
}

// ──── 8. ShopKeyword ───────────────────────────────────
export class ShopKeywordSchema extends BaseModel {
  static table = 'shop_keywords'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shopId: number

  @column()
  declare keyword: string

  @column()
  declare alertType: string

  @column()
  declare color: string | null

  @column()
  declare autoReplyText: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => ShopSchema, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof ShopSchema>
}

// ──── 9. AutoReplyTemplate ─────────────────────────────
export class AutoReplyTemplateSchema extends BaseModel {
  static table = 'auto_reply_templates'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare shopId: number

  @column()
  declare triggerLabel: string

  @column()
  declare templateText: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => ShopSchema, { foreignKey: 'shopId' })
  declare shop: BelongsTo<typeof ShopSchema>
}

// ──── Notification ─────────────────────────────────────
export class NotificationSchema extends BaseModel {
  static table = 'notifications'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare shopId: string | null

  @column()
  declare type: string

  @column()
  declare title: string

  @column()
  declare message: string | null

  @column()
  declare link: string | null

  @column()
  declare isRead: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
