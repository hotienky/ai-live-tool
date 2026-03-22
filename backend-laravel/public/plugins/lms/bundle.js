/**
 * Auto-generated stub bundle for module: lms
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'lms';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'lms/courses',label:'Khóa học',icon:'BookOpen',featureGroup:'store',moduleId:'lms'},{key:'lms/students',label:'Học viên',icon:'Users',featureGroup:'store',moduleId:'lms'},{key:'lms/certificates',label:'Chứng chỉ',icon:'Award',featureGroup:'store',moduleId:'lms'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'lms/courses':'lms-courses','lms/students':'lms-students','lms/certificates':'lms-certificates'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Khóa học trực tuyến (LMS)',
    version: '1.0.0',
    sidebar: {"group":"Khóa học","items":[{"key":"lms-courses","label":"Khóa học","icon":"BookOpen","route":"lms\/courses"},{"key":"lms-students","label":"Học viên","icon":"Users","route":"lms\/students"},{"key":"lms-certificates","label":"Chứng chỉ","icon":"Award","route":"lms\/certificates"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
