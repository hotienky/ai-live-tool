import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('shop_id').unsigned().references('id').inTable('shops').onDelete('CASCADE')
      table.string('carrier').notNullable().defaultTo('manual') // ghn, ghtk, viettel_post, manual
      table.string('tracking_code').nullable()
      table.enum('status', [
        'draft', 'pending', 'picked_up', 'in_transit',
        'out_for_delivery', 'delivered', 'returned', 'cancelled'
      ]).defaultTo('draft')

      // Sender info
      table.string('sender_name').nullable()
      table.string('sender_phone').nullable()
      table.string('sender_address').nullable()
      table.string('sender_ward').nullable()
      table.string('sender_district').nullable()
      table.string('sender_province').nullable()

      // Receiver info
      table.string('receiver_name').nullable()
      table.string('receiver_phone').nullable()
      table.string('receiver_address').nullable()
      table.string('receiver_ward').nullable()
      table.string('receiver_district').nullable()
      table.string('receiver_province').nullable()

      // Fees
      table.decimal('shipping_fee', 12, 2).defaultTo(0)
      table.decimal('cod_amount', 12, 2).defaultTo(0)
      table.decimal('insurance_fee', 12, 2).defaultTo(0)
      table.integer('weight').defaultTo(500) // grams
      table.string('dimensions').nullable() // "30x20x10"

      // Carrier response
      table.string('carrier_order_code').nullable()
      table.string('carrier_status').nullable()
      table.text('carrier_response').nullable()

      // Estimated delivery
      table.timestamp('estimated_delivery_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()

      table.text('notes').nullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
