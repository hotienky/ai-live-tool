import accountingPlugin from './plugins-src/accounting/index.js';
import blogPlugin from './plugins-src/blog/index.js';
import cmsPlugin from './plugins-src/cms/index.js';
import ecomPlugin from './plugins-src/ecom/index.js';
import livestreamPlugin from './plugins-src/livestream/index.js';
import marketingPlugin from './plugins-src/marketing/index.js';
import shippingPlugin from './plugins-src/shipping/index.js';
import taxPlugin from './plugins-src/tax/index.js';
import warehousePlugin from './plugins-src/warehouse/index.js';

export const STATIC_PLUGINS = {
  'accounting': accountingPlugin,
  'blog': blogPlugin,
  'cms': cmsPlugin,
  'ecom': ecomPlugin,
  'livestream': livestreamPlugin,
  'marketing': marketingPlugin,
  'shipping': shippingPlugin,
  'tax': taxPlugin,
  'warehouse': warehousePlugin,
};

export function registerStaticPlugins() {
  window.__STATIC_PLUGINS__ = STATIC_PLUGINS;
}