/**
 * Auto-generated stub bundle for module: restaurant
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'restaurant';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'restaurant/menu',label:'Menu',icon:'BookOpen',featureGroup:'store',moduleId:'restaurant'},{key:'restaurant/tables',label:'Đặt bàn',icon:'Armchair',featureGroup:'store',moduleId:'restaurant'},{key:'restaurant/orders',label:'Đơn hàng',icon:'ClipboardList',featureGroup:'store',moduleId:'restaurant'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'restaurant/menu':'restaurant-menu','restaurant/tables':'restaurant-tables','restaurant/orders':'restaurant-orders'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Nhà hàng & F&B',
    version: '1.0.0',
    sidebar: {"group":"Nhà hàng","items":[{"key":"restaurant-menu","label":"Menu","icon":"BookOpen","route":"restaurant\/menu"},{"key":"restaurant-tables","label":"Đặt bàn","icon":"Armchair","route":"restaurant\/tables"},{"key":"restaurant-orders","label":"Đơn hàng","icon":"ClipboardList","route":"restaurant\/orders"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
