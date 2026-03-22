/**
 * Auto-generated stub bundle for module: custom-fields
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'custom-fields';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'shop/custom-fields',label:'Trường tùy chỉnh',icon:'FormInput',featureGroup:'store',moduleId:'custom-fields'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'shop/custom-fields':'custom-fields'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Trường tùy chỉnh',
    version: '1.0.0',
    sidebar: {"group":"Cửa hàng","items":[{"key":"custom-fields","label":"Trường tùy chỉnh","icon":"FormInput","route":"shop\/custom-fields"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
