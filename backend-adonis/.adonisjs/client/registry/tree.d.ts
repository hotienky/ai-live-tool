/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    register: typeof routes['auth.register']
    login: typeof routes['auth.login']
    me: typeof routes['auth.me']
  }
  shops: {
    index: typeof routes['shops.index']
    store: typeof routes['shops.store']
    findOrCreate: typeof routes['shops.find_or_create']
    show: typeof routes['shops.show']
    update: typeof routes['shops.update']
    destroy: typeof routes['shops.destroy']
  }
  keywords: {
    index: typeof routes['keywords.index']
    store: typeof routes['keywords.store']
    destroy: typeof routes['keywords.destroy']
  }
  templates: {
    index: typeof routes['templates.index']
    store: typeof routes['templates.store']
    destroy: typeof routes['templates.destroy']
  }
  products: {
    index: typeof routes['products.index']
    store: typeof routes['products.store']
    update: typeof routes['products.update']
    destroy: typeof routes['products.destroy']
    stats: typeof routes['products.stats']
    adjustStock: typeof routes['products.adjust_stock']
    stockHistory: typeof routes['products.stock_history']
    importCsv: typeof routes['products.import_csv']
    exportCsv: typeof routes['products.export_csv']
    getVariants: typeof routes['products.get_variants']
    createVariant: typeof routes['products.create_variant']
    updateVariant: typeof routes['products.update_variant']
    deleteVariant: typeof routes['products.delete_variant']
  }
  leads: {
    index: typeof routes['leads.index']
    show: typeof routes['leads.show']
    update: typeof routes['leads.update']
    destroy: typeof routes['leads.destroy']
    pipelineStats: typeof routes['leads.pipeline_stats']
  }
  dashboard: {
    overview: typeof routes['dashboard.overview']
    recentLeads: typeof routes['dashboard.recent_leads']
    analytics: typeof routes['dashboard.analytics']
    topCustomers: typeof routes['dashboard.top_customers']
  }
  analytics: {
    daily: typeof routes['analytics.daily']
    hourly: typeof routes['analytics.hourly']
    conversion: typeof routes['analytics.conversion']
    topKeywords: typeof routes['analytics.top_keywords']
    summary: typeof routes['analytics.summary']
  }
  notifications: {
    index: typeof routes['notifications.index']
    unreadCount: typeof routes['notifications.unread_count']
    markRead: typeof routes['notifications.mark_read']
    markAllRead: typeof routes['notifications.mark_all_read']
  }
  customers: {
    index: typeof routes['customers.index']
    show: typeof routes['customers.show']
    update: typeof routes['customers.update']
    destroy: typeof routes['customers.destroy']
  }
  sessions: {
    index: typeof routes['sessions.index']
    show: typeof routes['sessions.show']
  }
  orders: {
    index: typeof routes['orders.index']
    stats: typeof routes['orders.stats']
    store: typeof routes['orders.store']
    show: typeof routes['orders.show']
    update: typeof routes['orders.update']
    destroy: typeof routes['orders.destroy']
  }
  schedules: {
    index: typeof routes['schedules.index']
    store: typeof routes['schedules.store']
    show: typeof routes['schedules.show']
    update: typeof routes['schedules.update']
    destroy: typeof routes['schedules.destroy']
  }
  webhooks: {
    index: typeof routes['webhooks.index']
    store: typeof routes['webhooks.store']
    update: typeof routes['webhooks.update']
    destroy: typeof routes['webhooks.destroy']
  }
  activityLogs: {
    index: typeof routes['activity_logs.index']
  }
  shipments: {
    index: typeof routes['shipments.index']
    store: typeof routes['shipments.store']
    stats: typeof routes['shipments.stats']
    show: typeof routes['shipments.show']
    updateStatus: typeof routes['shipments.update_status']
    tracking: typeof routes['shipments.tracking']
    destroy: typeof routes['shipments.destroy']
    getConfig: typeof routes['shipments.get_config']
    saveConfig: typeof routes['shipments.save_config']
    testConnection: typeof routes['shipments.test_connection']
    calculateFee: typeof routes['shipments.calculate_fee']
    getCarriers: typeof routes['shipments.get_carriers']
  }
  exports: {
    leads: typeof routes['exports.leads']
    comments: typeof routes['exports.comments']
    customers: typeof routes['exports.customers']
    report: typeof routes['exports.report']
  }
  replies: {
    generate: typeof routes['replies.generate']
    sentiment: typeof routes['replies.sentiment']
  }
}
