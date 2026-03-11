import router from '@adonisjs/core/services/router'

const DashboardController = () => import('#controllers/dashboard_controller')
const AnalyticsController = () => import('#controllers/analytics_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const ActivityLogsController = () => import('#controllers/activity_logs_controller')
const RolesController = () => import('#controllers/roles_controller')
const SystemConfigController = () => import('#controllers/system_config_controller')
const ApiKeysController = () => import('#controllers/api_keys_controller')
const LanguagesController = () => import('#controllers/languages_controller')
const CustomFieldsController = () => import('#controllers/custom_fields_controller')

/**
 * System routes — Dashboard, Analytics, Notifications, Config, Roles, Webhooks, Logs, i18n, Custom Fields
 */
export function registerSystemRoutes(group: ReturnType<typeof router.group>) {
  // Dashboard
  group.get('/dashboard/overview', [DashboardController, 'overview'])
  group.get('/dashboard/recent-leads', [DashboardController, 'recentLeads'])
  group.get('/dashboard/analytics', [DashboardController, 'analytics'])
  group.get('/dashboard/top-customers', [DashboardController, 'topCustomers'])
  group.get('/dashboard/order-stats', [DashboardController, 'orderStats'])

  // Analytics
  group.get('/analytics/daily', [AnalyticsController, 'daily'])
  group.get('/analytics/hourly', [AnalyticsController, 'hourly'])
  group.get('/analytics/conversion', [AnalyticsController, 'conversion'])
  group.get('/analytics/top-keywords', [AnalyticsController, 'topKeywords'])
  group.get('/analytics/summary', [AnalyticsController, 'summary'])
  group.get('/analytics/revenue', [AnalyticsController, 'revenue'])

  // Notifications
  group.get('/notifications', [NotificationsController, 'index'])
  group.get('/notifications/unread-count', [NotificationsController, 'unreadCount'])
  group.put('/notifications/:id/read', [NotificationsController, 'markRead'])
  group.put('/notifications/read-all', [NotificationsController, 'markAllRead'])

  // Webhooks
  group.get('/webhooks', [WebhooksController, 'index'])
  group.post('/webhooks', [WebhooksController, 'store'])
  group.put('/webhooks/:id', [WebhooksController, 'update'])
  group.delete('/webhooks/:id', [WebhooksController, 'destroy'])

  // Activity Logs
  group.get('/activity-logs', [ActivityLogsController, 'index'])
  group.get('/activity-logs/stats', [ActivityLogsController, 'stats'])
  group.get('/activity-logs/entity-types', [ActivityLogsController, 'entityTypes'])

  // Roles & Permissions
  group.get('/roles', [RolesController, 'index'])
  group.get('/roles/permissions', [RolesController, 'permissions'])
  group.post('/roles', [RolesController, 'store'])
  group.get('/roles/:id', [RolesController, 'show'])
  group.put('/roles/:id', [RolesController, 'update'])
  group.delete('/roles/:id', [RolesController, 'destroy'])
  group.get('/users', [RolesController, 'users'])
  group.put('/users/:id/role', [RolesController, 'assignRole'])

  // System Config
  group.get('/system-config', [SystemConfigController, 'index'])
  group.get('/system-config/:group', [SystemConfigController, 'show'])
  group.put('/system-config/:group', [SystemConfigController, 'update'])

  // API Keys
  group.get('/api-keys', [ApiKeysController, 'index'])
  group.post('/api-keys', [ApiKeysController, 'store'])
  group.put('/api-keys/:id', [ApiKeysController, 'update'])
  group.delete('/api-keys/:id', [ApiKeysController, 'destroy'])

  // Languages
  group.get('/languages', [LanguagesController, 'index'])
  group.post('/languages', [LanguagesController, 'store'])
  group.put('/languages/:id', [LanguagesController, 'update'])
  group.delete('/languages/:id', [LanguagesController, 'destroy'])
  group.get('/languages/:id/translations', [LanguagesController, 'getTranslations'])
  group.put('/languages/:id/translations', [LanguagesController, 'updateTranslations'])

  // Custom Fields
  group.get('/custom-fields', [CustomFieldsController, 'index'])
  group.post('/custom-fields', [CustomFieldsController, 'store'])
  group.put('/custom-fields/:id', [CustomFieldsController, 'update'])
  group.delete('/custom-fields/:id', [CustomFieldsController, 'destroy'])
  group.get('/custom-fields/values/:entityType/:entityId', [CustomFieldsController, 'getValues'])
  group.put('/custom-fields/values/:entityType/:entityId', [CustomFieldsController, 'saveValues'])
}
