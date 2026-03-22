/**
 * Auto-generated stub bundle for module: jobboard
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'jobboard';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'jobs/listings',label:'Tin tuyển dụng',icon:'Briefcase',featureGroup:'store',moduleId:'jobboard'},{key:'jobs/applicants',label:'Ứng viên',icon:'UserPlus',featureGroup:'store',moduleId:'jobboard'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'jobs/listings':'jobs','jobs/applicants':'applicants'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Bảng Tuyển dụng',
    version: '1.0.0',
    sidebar: {"group":"Tuyển dụng","items":[{"key":"jobs","label":"Tin tuyển dụng","icon":"Briefcase","route":"jobs\/listings"},{"key":"applicants","label":"Ứng viên","icon":"UserPlus","route":"jobs\/applicants"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
