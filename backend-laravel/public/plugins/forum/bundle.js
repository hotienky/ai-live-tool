/**
 * Auto-generated stub bundle for module: forum
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'forum';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'forum/threads',label:'Chủ đề',icon:'MessageCircle',featureGroup:'store',moduleId:'forum'},{key:'forum/moderation',label:'Kiểm duyệt',icon:'Shield',featureGroup:'store',moduleId:'forum'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'forum/threads':'forum-threads','forum/moderation':'forum-moderation'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Diễn đàn cộng đồng',
    version: '1.0.0',
    sidebar: {"group":"Cộng đồng","items":[{"key":"forum-threads","label":"Chủ đề","icon":"MessageCircle","route":"forum\/threads"},{"key":"forum-moderation","label":"Kiểm duyệt","icon":"Shield","route":"forum\/moderation"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
