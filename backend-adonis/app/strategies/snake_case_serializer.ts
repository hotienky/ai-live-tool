import { SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import string from '@adonisjs/core/helpers/string'

/**
 * Custom naming strategy that serializes model properties as snake_case
 * instead of the default camelCase serialization in Lucid v6.
 *
 * e.g. shopName -> shop_name, tiktokUsername -> tiktok_username
 */
export default class SnakeCaseSerializer extends SnakeCaseNamingStrategy {
  serializedName(_model: any, propertyName: string): string {
    return string.snakeCase(propertyName)
  }
}
