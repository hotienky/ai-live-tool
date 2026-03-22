/**
 * Auto-generated stub bundle for module: flash-sales
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'flash-sales';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'shop/flash-sales',label:'Flash Sale',icon:'Zap',featureGroup:'store',moduleId:'flash-sales'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'shop/flash-sales':'flash-sales'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Flash Sale',
    version: '1.0.0',
    sidebar: {"group":"Marketing","items":[{"key":"flash-sales","label":"Flash Sale","icon":"Zap","route":"shop\/flash-sales"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
