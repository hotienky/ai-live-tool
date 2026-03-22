/**
 * Auto-generated stub bundle for module: crm
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'crm';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'shop/crm',label:'CRM',icon:'Users',featureGroup:'store',moduleId:'crm'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'shop/crm':'crm'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'CRM Khách hàng',
    version: '1.0.0',
    sidebar: {"group":"Bán hàng","items":[{"key":"crm","label":"CRM","icon":"Users","route":"shop\/crm"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
