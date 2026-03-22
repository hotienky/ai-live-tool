/**
 * Auto-generated stub bundle for module: newsletter
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'newsletter';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'shop/newsletter',label:'Email',icon:'Mail',featureGroup:'store',moduleId:'newsletter'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'shop/newsletter':'newsletter'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Email Marketing',
    version: '1.0.0',
    sidebar: {"group":"Marketing","items":[{"key":"newsletter","label":"Email","icon":"Mail","route":"shop\/newsletter"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
