/**
 * Auto-generated stub bundle for module: events
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'events';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'events/list',label:'Sự kiện',icon:'CalendarPlus',featureGroup:'store',moduleId:'events'},{key:'events/tickets',label:'Vé',icon:'Ticket',featureGroup:'store',moduleId:'events'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'events/list':'events-list','events/tickets':'events-tickets'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Quản lý Sự kiện',
    version: '1.0.0',
    sidebar: {"group":"Sự kiện","items":[{"key":"events-list","label":"Sự kiện","icon":"CalendarPlus","route":"events\/list"},{"key":"events-tickets","label":"Vé","icon":"Ticket","route":"events\/tickets"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
