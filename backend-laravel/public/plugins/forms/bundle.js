/**
 * Auto-generated stub bundle for module: forms
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'forms';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'forms/list',label:'Forms',icon:'ClipboardEdit',featureGroup:'store',moduleId:'forms'},{key:'forms/submissions',label:'Phản hồi',icon:'Inbox',featureGroup:'store',moduleId:'forms'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'forms/list':'forms','forms/submissions':'form-submissions'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Form Builder',
    version: '1.0.0',
    sidebar: {"group":"Nội dung","items":[{"key":"forms","label":"Forms","icon":"ClipboardEdit","route":"forms\/list"},{"key":"form-submissions","label":"Phản hồi","icon":"Inbox","route":"forms\/submissions"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
