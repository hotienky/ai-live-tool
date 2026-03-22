/**
 * Auto-generated stub bundle for module: languages
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'languages';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'shop/languages',label:'Ngôn ngữ',icon:'Globe',featureGroup:'store',moduleId:'languages'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'shop/languages':'languages'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Đa ngôn ngữ',
    version: '1.0.0',
    sidebar: {"group":"Hệ thống","items":[{"key":"languages","label":"Ngôn ngữ","icon":"Globe","route":"shop\/languages"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
