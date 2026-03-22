/**
 * Auto-generated stub bundle for module: activity-log
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'activity-log';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'system/logs',label:'Nhật ký',icon:'ScrollText',featureGroup:'store',moduleId:'activity-log'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'system/logs':'activity-log'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Nhật ký hoạt động',
    version: '1.0.0',
    sidebar: {"group":"Hệ thống","items":[{"key":"activity-log","label":"Nhật ký","icon":"ScrollText","route":"system\/logs"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
