/**
 * Auto-generated stub bundle for module: membership
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'membership';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'membership/tiers',label:'Cấp thành viên',icon:'Crown',featureGroup:'store',moduleId:'membership'},{key:'membership/members',label:'Thành viên',icon:'Users',featureGroup:'store',moduleId:'membership'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'membership/tiers':'membership-tiers','membership/members':'membership-members'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Hội viên & Thành viên',
    version: '1.0.0',
    sidebar: {"group":"Cộng đồng","items":[{"key":"membership-tiers","label":"Cấp thành viên","icon":"Crown","route":"membership\/tiers"},{"key":"membership-members","label":"Thành viên","icon":"Users","route":"membership\/members"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
