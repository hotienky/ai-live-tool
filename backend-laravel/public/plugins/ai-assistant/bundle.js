/**
 * Auto-generated stub bundle for module: ai-assistant
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'ai-assistant';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'tools/ai-writer',label:'AI Writer',icon:'Sparkles',featureGroup:'store',moduleId:'ai-assistant'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'tools/ai-writer':'ai-writer'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'AI Trợ lý viết nội dung',
    version: '1.0.0',
    sidebar: {"group":"Công cụ","items":[{"key":"ai-writer","label":"AI Writer","icon":"Sparkles","route":"tools\/ai-writer"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
