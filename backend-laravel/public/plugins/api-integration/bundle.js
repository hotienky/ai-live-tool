/**
 * Auto-generated stub bundle for module: api-integration
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'api-integration';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'system/api-keys',label:'API Keys',icon:'Key',featureGroup:'store',moduleId:'api-integration'},{key:'system/webhooks',label:'Webhooks',icon:'Webhook',featureGroup:'store',moduleId:'api-integration'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'system/api-keys':'api-keys','system/webhooks':'webhooks'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'API & Webhooks',
    version: '1.0.0',
    sidebar: {"group":"Hệ thống","items":[{"key":"api-keys","label":"API Keys","icon":"Key","route":"system\/api-keys"},{"key":"webhooks","label":"Webhooks","icon":"Webhook","route":"system\/webhooks"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
