import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'

export default class ProductsController {
  async index({ request, response }: HttpContext) {
    const { shopId } = request.qs()
    const query = Product.query().orderBy('created_at', 'desc')
    if (shopId) query.where('shop_id', shopId)
    const products = await query
    return response.json(products)
  }

  async store({ request, response }: HttpContext) {
    const data = request.only(['shopId', 'name', 'price', 'keywords', 'description', 'imageUrl'])
    if (!data.name) return response.badRequest({ error: 'name is required' })
    const product = await Product.create({ ...data, isActive: true })
    return response.json(product)
  }

  async update({ params, request, response }: HttpContext) {
    const product = await Product.find(params.id)
    if (!product) return response.notFound({ error: 'Product not found' })
    product.merge(request.only(['name', 'price', 'keywords', 'description', 'imageUrl', 'isActive']))
    await product.save()
    return response.json(product)
  }

  async destroy({ params, response }: HttpContext) {
    const product = await Product.find(params.id)
    if (!product) return response.notFound({ error: 'Product not found' })
    await product.delete()
    return response.json({ success: true })
  }
}
