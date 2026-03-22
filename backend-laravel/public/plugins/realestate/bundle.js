/**
 * Auto-generated stub bundle for module: realestate
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'realestate';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'realestate/listings',label:'Tin đăng',icon:'Home',featureGroup:'store',moduleId:'realestate'},{key:'realestate/agents',label:'Môi giới',icon:'UserCircle',featureGroup:'store',moduleId:'realestate'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'realestate/listings':'property-listings','realestate/agents':'property-agents'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Bất động sản',
    version: '1.0.0',
    sidebar: {"group":"Bất động sản","items":[{"key":"property-listings","label":"Tin đăng","icon":"Home","route":"realestate\/listings"},{"key":"property-agents","label":"Môi giới","icon":"UserCircle","route":"realestate\/agents"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
