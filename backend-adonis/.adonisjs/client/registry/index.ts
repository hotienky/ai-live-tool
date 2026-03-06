/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.register': {
    methods: ["POST"],
    pattern: '/api/auth/register',
    tokens: [{"old":"/api/auth/register","type":0,"val":"api","end":""},{"old":"/api/auth/register","type":0,"val":"auth","end":""},{"old":"/api/auth/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [{"old":"/api/auth/login","type":0,"val":"api","end":""},{"old":"/api/auth/login","type":0,"val":"auth","end":""},{"old":"/api/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/me',
    tokens: [{"old":"/api/auth/me","type":0,"val":"api","end":""},{"old":"/api/auth/me","type":0,"val":"auth","end":""},{"old":"/api/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'shops.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/shops',
    tokens: [{"old":"/api/shops","type":0,"val":"api","end":""},{"old":"/api/shops","type":0,"val":"shops","end":""}],
    types: placeholder as Registry['shops.index']['types'],
  },
  'shops.store': {
    methods: ["POST"],
    pattern: '/api/shops',
    tokens: [{"old":"/api/shops","type":0,"val":"api","end":""},{"old":"/api/shops","type":0,"val":"shops","end":""}],
    types: placeholder as Registry['shops.store']['types'],
  },
  'shops.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/shops/:id',
    tokens: [{"old":"/api/shops/:id","type":0,"val":"api","end":""},{"old":"/api/shops/:id","type":0,"val":"shops","end":""},{"old":"/api/shops/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shops.show']['types'],
  },
  'shops.update': {
    methods: ["PUT"],
    pattern: '/api/shops/:id',
    tokens: [{"old":"/api/shops/:id","type":0,"val":"api","end":""},{"old":"/api/shops/:id","type":0,"val":"shops","end":""},{"old":"/api/shops/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shops.update']['types'],
  },
  'shops.destroy': {
    methods: ["DELETE"],
    pattern: '/api/shops/:id',
    tokens: [{"old":"/api/shops/:id","type":0,"val":"api","end":""},{"old":"/api/shops/:id","type":0,"val":"shops","end":""},{"old":"/api/shops/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shops.destroy']['types'],
  },
  'keywords.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/shops/:shopId/keywords',
    tokens: [{"old":"/api/shops/:shopId/keywords","type":0,"val":"api","end":""},{"old":"/api/shops/:shopId/keywords","type":0,"val":"shops","end":""},{"old":"/api/shops/:shopId/keywords","type":1,"val":"shopId","end":""},{"old":"/api/shops/:shopId/keywords","type":0,"val":"keywords","end":""}],
    types: placeholder as Registry['keywords.index']['types'],
  },
  'keywords.store': {
    methods: ["POST"],
    pattern: '/api/shops/:shopId/keywords',
    tokens: [{"old":"/api/shops/:shopId/keywords","type":0,"val":"api","end":""},{"old":"/api/shops/:shopId/keywords","type":0,"val":"shops","end":""},{"old":"/api/shops/:shopId/keywords","type":1,"val":"shopId","end":""},{"old":"/api/shops/:shopId/keywords","type":0,"val":"keywords","end":""}],
    types: placeholder as Registry['keywords.store']['types'],
  },
  'keywords.destroy': {
    methods: ["DELETE"],
    pattern: '/api/shops/:shopId/keywords/:id',
    tokens: [{"old":"/api/shops/:shopId/keywords/:id","type":0,"val":"api","end":""},{"old":"/api/shops/:shopId/keywords/:id","type":0,"val":"shops","end":""},{"old":"/api/shops/:shopId/keywords/:id","type":1,"val":"shopId","end":""},{"old":"/api/shops/:shopId/keywords/:id","type":0,"val":"keywords","end":""},{"old":"/api/shops/:shopId/keywords/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['keywords.destroy']['types'],
  },
  'templates.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/shops/:shopId/templates',
    tokens: [{"old":"/api/shops/:shopId/templates","type":0,"val":"api","end":""},{"old":"/api/shops/:shopId/templates","type":0,"val":"shops","end":""},{"old":"/api/shops/:shopId/templates","type":1,"val":"shopId","end":""},{"old":"/api/shops/:shopId/templates","type":0,"val":"templates","end":""}],
    types: placeholder as Registry['templates.index']['types'],
  },
  'templates.store': {
    methods: ["POST"],
    pattern: '/api/shops/:shopId/templates',
    tokens: [{"old":"/api/shops/:shopId/templates","type":0,"val":"api","end":""},{"old":"/api/shops/:shopId/templates","type":0,"val":"shops","end":""},{"old":"/api/shops/:shopId/templates","type":1,"val":"shopId","end":""},{"old":"/api/shops/:shopId/templates","type":0,"val":"templates","end":""}],
    types: placeholder as Registry['templates.store']['types'],
  },
  'templates.destroy': {
    methods: ["DELETE"],
    pattern: '/api/shops/:shopId/templates/:id',
    tokens: [{"old":"/api/shops/:shopId/templates/:id","type":0,"val":"api","end":""},{"old":"/api/shops/:shopId/templates/:id","type":0,"val":"shops","end":""},{"old":"/api/shops/:shopId/templates/:id","type":1,"val":"shopId","end":""},{"old":"/api/shops/:shopId/templates/:id","type":0,"val":"templates","end":""},{"old":"/api/shops/:shopId/templates/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['templates.destroy']['types'],
  },
  'products.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/products',
    tokens: [{"old":"/api/products","type":0,"val":"api","end":""},{"old":"/api/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.index']['types'],
  },
  'products.store': {
    methods: ["POST"],
    pattern: '/api/products',
    tokens: [{"old":"/api/products","type":0,"val":"api","end":""},{"old":"/api/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.store']['types'],
  },
  'products.update': {
    methods: ["PUT"],
    pattern: '/api/products/:id',
    tokens: [{"old":"/api/products/:id","type":0,"val":"api","end":""},{"old":"/api/products/:id","type":0,"val":"products","end":""},{"old":"/api/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.update']['types'],
  },
  'products.destroy': {
    methods: ["DELETE"],
    pattern: '/api/products/:id',
    tokens: [{"old":"/api/products/:id","type":0,"val":"api","end":""},{"old":"/api/products/:id","type":0,"val":"products","end":""},{"old":"/api/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.destroy']['types'],
  },
  'leads.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/leads',
    tokens: [{"old":"/api/leads","type":0,"val":"api","end":""},{"old":"/api/leads","type":0,"val":"leads","end":""}],
    types: placeholder as Registry['leads.index']['types'],
  },
  'leads.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/leads/:id',
    tokens: [{"old":"/api/leads/:id","type":0,"val":"api","end":""},{"old":"/api/leads/:id","type":0,"val":"leads","end":""},{"old":"/api/leads/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['leads.show']['types'],
  },
  'leads.update': {
    methods: ["PUT"],
    pattern: '/api/leads/:id',
    tokens: [{"old":"/api/leads/:id","type":0,"val":"api","end":""},{"old":"/api/leads/:id","type":0,"val":"leads","end":""},{"old":"/api/leads/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['leads.update']['types'],
  },
  'leads.destroy': {
    methods: ["DELETE"],
    pattern: '/api/leads/:id',
    tokens: [{"old":"/api/leads/:id","type":0,"val":"api","end":""},{"old":"/api/leads/:id","type":0,"val":"leads","end":""},{"old":"/api/leads/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['leads.destroy']['types'],
  },
  'leads.pipeline_stats': {
    methods: ["GET","HEAD"],
    pattern: '/api/leads-pipeline',
    tokens: [{"old":"/api/leads-pipeline","type":0,"val":"api","end":""},{"old":"/api/leads-pipeline","type":0,"val":"leads-pipeline","end":""}],
    types: placeholder as Registry['leads.pipeline_stats']['types'],
  },
  'dashboard.overview': {
    methods: ["GET","HEAD"],
    pattern: '/api/dashboard/overview',
    tokens: [{"old":"/api/dashboard/overview","type":0,"val":"api","end":""},{"old":"/api/dashboard/overview","type":0,"val":"dashboard","end":""},{"old":"/api/dashboard/overview","type":0,"val":"overview","end":""}],
    types: placeholder as Registry['dashboard.overview']['types'],
  },
  'analytics.daily': {
    methods: ["GET","HEAD"],
    pattern: '/api/analytics/daily',
    tokens: [{"old":"/api/analytics/daily","type":0,"val":"api","end":""},{"old":"/api/analytics/daily","type":0,"val":"analytics","end":""},{"old":"/api/analytics/daily","type":0,"val":"daily","end":""}],
    types: placeholder as Registry['analytics.daily']['types'],
  },
  'analytics.hourly': {
    methods: ["GET","HEAD"],
    pattern: '/api/analytics/hourly',
    tokens: [{"old":"/api/analytics/hourly","type":0,"val":"api","end":""},{"old":"/api/analytics/hourly","type":0,"val":"analytics","end":""},{"old":"/api/analytics/hourly","type":0,"val":"hourly","end":""}],
    types: placeholder as Registry['analytics.hourly']['types'],
  },
  'analytics.conversion': {
    methods: ["GET","HEAD"],
    pattern: '/api/analytics/conversion',
    tokens: [{"old":"/api/analytics/conversion","type":0,"val":"api","end":""},{"old":"/api/analytics/conversion","type":0,"val":"analytics","end":""},{"old":"/api/analytics/conversion","type":0,"val":"conversion","end":""}],
    types: placeholder as Registry['analytics.conversion']['types'],
  },
  'analytics.top_keywords': {
    methods: ["GET","HEAD"],
    pattern: '/api/analytics/top-keywords',
    tokens: [{"old":"/api/analytics/top-keywords","type":0,"val":"api","end":""},{"old":"/api/analytics/top-keywords","type":0,"val":"analytics","end":""},{"old":"/api/analytics/top-keywords","type":0,"val":"top-keywords","end":""}],
    types: placeholder as Registry['analytics.top_keywords']['types'],
  },
  'analytics.summary': {
    methods: ["GET","HEAD"],
    pattern: '/api/analytics/summary',
    tokens: [{"old":"/api/analytics/summary","type":0,"val":"api","end":""},{"old":"/api/analytics/summary","type":0,"val":"analytics","end":""},{"old":"/api/analytics/summary","type":0,"val":"summary","end":""}],
    types: placeholder as Registry['analytics.summary']['types'],
  },
  'customers.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/customers',
    tokens: [{"old":"/api/customers","type":0,"val":"api","end":""},{"old":"/api/customers","type":0,"val":"customers","end":""}],
    types: placeholder as Registry['customers.index']['types'],
  },
  'customers.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/customers/:id',
    tokens: [{"old":"/api/customers/:id","type":0,"val":"api","end":""},{"old":"/api/customers/:id","type":0,"val":"customers","end":""},{"old":"/api/customers/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['customers.show']['types'],
  },
  'sessions.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/sessions',
    tokens: [{"old":"/api/sessions","type":0,"val":"api","end":""},{"old":"/api/sessions","type":0,"val":"sessions","end":""}],
    types: placeholder as Registry['sessions.index']['types'],
  },
  'sessions.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/sessions/:id',
    tokens: [{"old":"/api/sessions/:id","type":0,"val":"api","end":""},{"old":"/api/sessions/:id","type":0,"val":"sessions","end":""},{"old":"/api/sessions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['sessions.show']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
