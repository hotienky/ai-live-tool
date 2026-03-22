/**
 * Auto-generated stub bundle for module: lucky-draw
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'lucky-draw';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'shop/lucky-draw',label:'Vòng quay',icon:'Dices',featureGroup:'store',moduleId:'lucky-draw'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'shop/lucky-draw':'lucky-draw'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Vòng quay may mắn',
    version: '1.0.0',
    sidebar: {"group":"Marketing","items":[{"key":"lucky-draw","label":"Vòng quay","icon":"Dices","route":"shop\/lucky-draw"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
