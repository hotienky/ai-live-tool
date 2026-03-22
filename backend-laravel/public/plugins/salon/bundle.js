/**
 * Auto-generated stub bundle for module: salon
 * This registers sidebar items and routes via the hook system.
 * Replace with a full bundle when custom UI components are available.
 */
(function() {
  var id = 'salon';
  var hooks = (window.__APP_BRIDGE__ && window.__APP_BRIDGE__.hooks) || window.__APP_HOOKS__;
  if (!hooks) { console.warn('[Plugin:' + id + '] Hooks not available'); return; }

  // Register sidebar items
  hooks.addFilter('sidebar_items', function(items) {
    items.push({key:'salon/services',label:'Dịch vụ',icon:'Sparkles',featureGroup:'store',moduleId:'salon'},{key:'salon/staff',label:'Nhân viên',icon:'Users',featureGroup:'store',moduleId:'salon'},{key:'salon/bookings',label:'Lịch hẹn',icon:'CalendarCheck',featureGroup:'store',moduleId:'salon'});
    return items;
  });

  // Register admin routes
  hooks.addFilter('admin_routes', function(config) {
    Object.assign(config.routeToTab, {'salon/services':'salon-services','salon/staff':'salon-staff','salon/bookings':'salon-bookings'});
    return config;
  });

  // Register plugin
  var plugin = {
    id: id,
    name: 'Salon & Spa',
    version: '1.0.0',
    sidebar: {"group":"Salon","items":[{"key":"salon-services","label":"Dịch vụ","icon":"Sparkles","route":"salon\/services"},{"key":"salon-staff","label":"Nhân viên","icon":"Users","route":"salon\/staff"},{"key":"salon-bookings","label":"Lịch hẹn","icon":"CalendarCheck","route":"salon\/bookings"}]}
  };
  window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {};
  window.__PLUGIN_REGISTRY__[id] = plugin;
})();
