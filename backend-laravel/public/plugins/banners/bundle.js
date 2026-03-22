/**
 * Auto-generated stub bundle for module: banners
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'banners';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'shop/banners',label:'Banner',icon:'Image',featureGroup:'store',moduleId:'banners'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'shop/banners':'banners'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Quản lý Banner',
    version: '1.0.0',
    sidebar: {"group":"Giao diện","items":[{"key":"banners","label":"Banner","icon":"Image","route":"shop\/banners"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
