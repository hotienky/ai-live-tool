import router from '@adonisjs/core/services/router'

const LeadsController = () => import('#controllers/leads_controller')
const CustomersController = () => import('#controllers/customers_controller')
const SessionsController = () => import('#controllers/sessions_controller')

/**
 * CRM routes — Leads, Customers, Sessions
 */
export function registerCrmRoutes(group: ReturnType<typeof router.group>) {
  // Leads
  group.get('/leads', [LeadsController, 'index'])
  group.get('/leads/stats', [LeadsController, 'pipelineStats'])
  group.get('/leads/:id', [LeadsController, 'show'])
  group.put('/leads/:id', [LeadsController, 'update'])
  group.delete('/leads/:id', [LeadsController, 'destroy'])
  group.get('/leads-pipeline', [LeadsController, 'pipelineStats']).as('leads.pipelineLegacy')

  // Customers
  group.get('/customers', [CustomersController, 'index'])
  group.get('/customers/:id', [CustomersController, 'show'])
  group.put('/customers/:id', [CustomersController, 'update'])
  group.delete('/customers/:id', [CustomersController, 'destroy'])

  // Sessions
  group.get('/sessions', [SessionsController, 'index'])
  group.get('/sessions/:id', [SessionsController, 'show'])
}
